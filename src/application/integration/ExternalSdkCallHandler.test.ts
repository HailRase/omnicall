/**
 * DI-06: ownership, revision contract, idempotency, control command matrix.
 */

import { describe, expect, it, vi } from "vitest";

import {
  createCallId,
  createOutgoingCall,
  createPhoneNumber,
  type Call,
} from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";

import { ExternalSdkAccountHandler } from "./ExternalSdkAccountHandler.js";
import { ExternalSdkCallHandler } from "./ExternalSdkCallHandler.js";
import type { ExternalSdkCallPort } from "./ExternalSdkCallPort.js";
import { ExternalSdkOperatorHandler } from "./ExternalSdkOperatorHandler.js";
import { ExternalSdkProductHandler } from "./ExternalSdkProductHandler.js";
import { ExternalSdkReadHandler } from "./ExternalSdkReadHandler.js";
import { SdkCallOwnershipRegistry } from "./SdkCallOwnershipRegistry.js";
import { SdkSessionRevisionClock } from "./SdkSessionRevisionClock.js";

const BASE = {
  protocolVersion: 1,
  kind: "command" as const,
  serverInstanceId: "srv_test_001",
  sessionEpoch: "epoch_test_001",
  occurredAt: "2026-07-20T09:00:00.000Z",
};

function call(id: string): Call {
  return createOutgoingCall(createCallId(id), createPhoneNumber("+15551234567"));
}

function createPort(overrides: Partial<ExternalSdkCallPort> = {}): ExternalSdkCallPort {
  return {
    makeCall: vi.fn(() => Promise.resolve(ok(call("call_out_001")))),
    answerCall: vi.fn(() => Promise.resolve(ok(call("call_in_001")))),
    rejectCall: vi.fn(() => Promise.resolve(ok(call("call_in_001")))),
    hangupCall: vi.fn(() => Promise.resolve(ok(call("call_out_001")))),
    holdCall: vi.fn(() => Promise.resolve(ok(call("call_out_001")))),
    resumeCall: vi.fn(() => Promise.resolve(ok(call("call_out_001")))),
    muteCall: vi.fn(() => Promise.resolve(ok(call("call_out_001")))),
    unmuteCall: vi.fn(() => Promise.resolve(ok(call("call_out_001")))),
    sendDtmf: vi.fn(() => Promise.resolve(ok(undefined))),
    ...overrides,
  };
}

function createHandler(port: ExternalSdkCallPort = createPort()) {
  const ownership = new SdkCallOwnershipRegistry();
  const revisionClock = new SdkSessionRevisionClock();
  const handler = new ExternalSdkCallHandler({
    callPort: port,
    ownership,
    revisionClock,
  });
  return { handler, ownership, revisionClock, port };
}

function createProductSurface(port: ExternalSdkCallPort = createPort()) {
  const ownership = new SdkCallOwnershipRegistry();
  const revisionClock = new SdkSessionRevisionClock();
  const readHandler = new ExternalSdkReadHandler({
    readProductState: () => ({
      signedIn: false,
      profileLabel: null,
      registrationState: "idle",
      registrationReasonCode: null,
      calls: [],
      ocpEnabled: false,
      ocpConnected: false,
      operatorStatus: null,
      operatorReasonId: null,
      operatorReasonLabelKey: null,
      reservedStatus: null,
      reservedReasonId: null,
      activeCampaign: null,
    }),
    revisionClock,
    ownership,
  });
  const callHandler = new ExternalSdkCallHandler({
    callPort: port,
    ownership,
    revisionClock,
  });
  const operatorHandler = new ExternalSdkOperatorHandler({
    operatorPort: {
      changeOperatorStatus: () =>
        Promise.resolve(
          err(createPlatformError("not_found", "ocp_operator_profile_missing")),
        ),
      finishPostCallAppeal: () =>
        Promise.resolve(
          err(createPlatformError("not_found", "ocp_operator_profile_missing")),
        ),
      listOperatorReasons: () => [],
      readOcpSession: () => ({
        isAuthenticated: false,
        isLive: false,
        hasOperatorSnapshot: false,
      }),
      logoutAccountSession: () =>
        Promise.resolve(
          ok({
            ocpStep: "not_connected",
            sipSessionEnded: true,
            operatorSnapshotMissing: false,
          }),
        ),
    },
    revisionClock,
  });
  const accountHandler = new ExternalSdkAccountHandler({
    accountPort: {
      activateSavedProfileByLogin: () =>
        Promise.resolve(
          err(createPlatformError("forbidden", "sdk_activate_not_used")),
        ),
      lookupSavedProfileByLogin: () =>
        Promise.resolve(
          err(createPlatformError("forbidden", "sdk_activate_not_used")),
        ),
      getActivateSessionView: () => ({
        signedIn: false,
        currentLogin: null,
        currentMode: null,
        profileLabel: null,
      }),
    },
    revisionClock,
  });
  const product = new ExternalSdkProductHandler({
    readHandler,
    callHandler,
    operatorHandler,
    accountHandler,
  });
  return { product, ownership, revisionClock, port };
}

describe("ExternalSdkCallHandler", () => {
  it("denies call command without clientId as unauthenticated", async () => {
    const { handler } = createHandler();
    const result = await handler.handleCommand({
      ...BASE,
      type: "call:originate",
      requestId: "req_unauth_001",
      payload: { destination: "+15551234567", expectedRevision: 1 },
    });
    expect(result).toEqual({
      ok: false,
      code: "unauthenticated",
      retryable: false,
    });
  });

  it("originates, assigns owner, and returns post-advance revision", async () => {
    const { handler, ownership, port, revisionClock } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "call:originate",
        requestId: "req_orig_001",
        payload: { destination: "+15551234567", expectedRevision: 1 },
      },
      { clientId: "client_a" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.result).toEqual({ callId: "call_out_001", accepted: true });
    expect(result.revision).toBe(2);
    expect(revisionClock.peek()).toBe(2);
    expect(ownership.getOwnerClientId("call_out_001")).toBe("client_a");
    expect(port.makeCall).toHaveBeenCalledTimes(1);
  });

  it("chains hold using reply.revision from originate (not peek)", async () => {
    const { handler, port } = createHandler();
    const originate = await handler.handleCommand(
      {
        ...BASE,
        type: "call:originate",
        requestId: "req_chain_orig",
        payload: { destination: "+15551234567", expectedRevision: 1 },
      },
      { clientId: "client_a" },
    );
    expect(originate.ok).toBe(true);
    if (!originate.ok) {
      return;
    }
    const hold = await handler.handleCommand(
      {
        ...BASE,
        type: "call:hold",
        requestId: "req_chain_hold",
        payload: {
          callId: "call_out_001",
          expectedRevision: originate.revision,
        },
      },
      { clientId: "client_a" },
    );
    expect(hold.ok).toBe(true);
    if (!hold.ok) {
      return;
    }
    expect(hold.revision).toBe(3);
    expect(port.makeCall).toHaveBeenCalledTimes(1);
    expect(port.holdCall).toHaveBeenCalledTimes(1);
  });

  it("allows snapshot revision as next mutate expectedRevision", async () => {
    const { product, port } = createProductSurface();
    const snapshot = await product.handleCommand(
      {
        ...BASE,
        type: "sdk:get-snapshot",
        requestId: "req_snap_001",
        payload: {},
      },
      { clientId: "client_a" },
    );
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) {
      return;
    }
    expect(snapshot.revision).toBe(1);
    const originate = await product.handleCommand(
      {
        ...BASE,
        type: "call:originate",
        requestId: "req_snap_orig",
        payload: {
          destination: "+15551234567",
          expectedRevision: snapshot.revision,
        },
      },
      { clientId: "client_a" },
    );
    expect(originate.ok).toBe(true);
    if (!originate.ok) {
      return;
    }
    expect(originate.revision).toBe(2);
    expect(port.makeCall).toHaveBeenCalledTimes(1);
  });

  it("rejects stale expectedRevision without side effect", async () => {
    const { handler, port } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "call:originate",
        requestId: "req_stale_001",
        payload: { destination: "+15551234567", expectedRevision: 99 },
      },
      { clientId: "client_a" },
    );
    expect(result).toEqual({
      ok: false,
      code: "stale_state",
      retryable: false,
      currentRevision: 1,
    });
    expect(port.makeCall).not.toHaveBeenCalled();
  });

  it("allows cross-client control for shared desk (ADR-0021)", async () => {
    const { handler, ownership, port } = createHandler();
    ownership.assignOwner("call_out_001", "client_a");
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "call:hold",
        requestId: "req_hold_b",
        payload: { callId: "call_out_001", expectedRevision: 1 },
      },
      { clientId: "client_b" },
    );
    expect(result.ok).toBe(true);
    expect(port.holdCall).toHaveBeenCalledTimes(1);
  });

  it("allows control of unowned desktop/UI call", async () => {
    const { handler, port } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "call:mute",
        requestId: "req_mute_unowned",
        payload: { callId: "call_ui_001", expectedRevision: 1 },
      },
      { clientId: "client_crm" },
    );
    expect(result.ok).toBe(true);
    expect(port.muteCall).toHaveBeenCalledTimes(1);
  });

  it("allows owner hold/resume/mute/unmute/dtmf/hangup via reply revision chain", async () => {
    const { handler, ownership, port } = createHandler();
    ownership.assignOwner("call_out_001", "client_a");
    const commands = [
      "call:hold",
      "call:resume",
      "call:mute",
      "call:unmute",
      "call:send-dtmf",
      "call:hangup",
    ] as const;
    let expectedRevision = 1;
    for (const type of commands) {
      const payload =
        type === "call:send-dtmf"
          ? {
              callId: "call_out_001",
              digits: "12",
              expectedRevision,
            }
          : { callId: "call_out_001", expectedRevision };
      const result = await handler.handleCommand(
        {
          ...BASE,
          type,
          requestId: `req_${type}`,
          payload,
        },
        { clientId: "client_a" },
      );
      expect(result.ok, type).toBe(true);
      if (!result.ok || result.revision === undefined) {
        return;
      }
      expectedRevision = result.revision;
    }
    expect(port.sendDtmf).toHaveBeenCalledTimes(2);
    expect(ownership.get("call_out_001")?.terminal).toBe(true);
    expect(expectedRevision).toBe(7);
  });

  it("assigns ownership on successful answer for answerer", async () => {
    const { handler, ownership } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "call:answer",
        requestId: "req_ans_001",
        payload: { callId: "call_in_001", expectedRevision: 1 },
      },
      { clientId: "client_answerer" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.revision).toBe(2);
    expect(ownership.getOwnerClientId("call_in_001")).toBe("client_answerer");
  });

  it("returns cached reply for duplicate requestId without second UC", async () => {
    const { handler, port } = createHandler();
    const command = {
      ...BASE,
      type: "call:originate" as const,
      requestId: "req_dup_001",
      payload: { destination: "+15551234567", expectedRevision: 1 },
    };
    const first = await handler.handleCommand(command, { clientId: "client_a" });
    const second = await handler.handleCommand(command, { clientId: "client_a" });
    expect(first).toEqual(second);
    expect(port.makeCall).toHaveBeenCalledTimes(1);
  });

  it("maps invalid destination to invalid_payload", async () => {
    const port = createPort({
      makeCall: vi.fn(() =>
        Promise.resolve(
          err(createPlatformError("validation_failed", "bad number")),
        ),
      ),
    });
    const { handler } = createHandler(port);
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "call:originate",
        requestId: "req_bad_dest",
        payload: { destination: "!!!", expectedRevision: 1 },
      },
      { clientId: "client_a" },
    );
    expect(result).toEqual({
      ok: false,
      code: "invalid_payload",
      retryable: false,
    });
  });

  it("maps SIP not registered originate to operation_failed + failure_kind", async () => {
    const port = createPort({
      makeCall: vi.fn(() =>
        Promise.resolve(
          err(
            createPlatformError(
              "operation_failed",
              "SIP not registered for outbound call",
              { reason: "sip_not_registered" },
            ),
          ),
        ),
      ),
    });
    const { handler } = createHandler(port);
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "call:originate",
        requestId: "req_sip_unreg",
        payload: { destination: "1", expectedRevision: 1 },
      },
      { clientId: "client_a" },
    );
    expect(result).toEqual({
      ok: false,
      code: "operation_failed",
      retryable: false,
      details: { failure_kind: "sip_not_registered" },
    });
  });

  it("maps unknown call control failure to not_found", async () => {
    const port = createPort({
      hangupCall: vi.fn(() =>
        Promise.resolve(err(createPlatformError("not_found", "missing"))),
      ),
    });
    const { handler, ownership } = createHandler(port);
    ownership.assignOwner("call_missing", "client_a");
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "call:hangup",
        requestId: "req_missing",
        payload: { callId: "call_missing", expectedRevision: 1 },
      },
      { clientId: "client_a" },
    );
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
    });
  });

  it("serializes concurrent distinct requestIds on the same call", async () => {
    let releaseHold!: () => void;
    const holdGate = new Promise<void>((resolve) => {
      releaseHold = resolve;
    });
    const port = createPort({
      holdCall: vi.fn(async () => {
        await holdGate;
        return ok(call("call_out_001"));
      }),
      muteCall: vi.fn(() => Promise.resolve(ok(call("call_out_001")))),
    });
    const { handler, ownership } = createHandler(port);
    ownership.assignOwner("call_out_001", "client_a");
    const holdPromise = handler.handleCommand(
      {
        ...BASE,
        type: "call:hold",
        requestId: "req_race_hold",
        payload: { callId: "call_out_001", expectedRevision: 1 },
      },
      { clientId: "client_a" },
    );
    // Second request uses the same pre-hold revision (client race); after serialize → stale.
    const mutePromise = handler.handleCommand(
      {
        ...BASE,
        type: "call:mute",
        requestId: "req_race_mute",
        payload: {
          callId: "call_out_001",
          expectedRevision: 1,
        },
      },
      { clientId: "client_a" },
    );
    releaseHold();
    const [holdResult, muteResult] = await Promise.all([holdPromise, mutePromise]);
    expect(holdResult.ok).toBe(true);
    if (!holdResult.ok) {
      return;
    }
    expect(holdResult.revision).toBe(2);
    expect(muteResult).toEqual({
      ok: false,
      code: "stale_state",
      retryable: false,
      currentRevision: 2,
    });
    expect(port.holdCall).toHaveBeenCalledTimes(1);
    expect(port.muteCall).not.toHaveBeenCalled();
  });
});

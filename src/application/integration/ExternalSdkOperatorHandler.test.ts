/**
 * DI-07: operator status + prepare/confirm logout + revision contract.
 */

import { describe, expect, it, vi } from "vitest";

import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";

import { ExternalSdkAccountHandler } from "./ExternalSdkAccountHandler.js";
import { ExternalSdkOperatorHandler } from "./ExternalSdkOperatorHandler.js";
import type {
  ExternalSdkOperatorPort,
  SdkOperatorReasonDto,
} from "./ExternalSdkOperatorPort.js";
import { ExternalSdkCallHandler } from "./ExternalSdkCallHandler.js";
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

const CLIENT = "client_op_001";

const REASONS: ReadonlyArray<SdkOperatorReasonDto> = [
  { id: 1, label: "Ready", kind: "ready" },
  { id: 7, label: "Break", kind: "break" },
  { id: 90, label: "End of shift", kind: "logout" },
];

function createPort(
  overrides: Partial<ExternalSdkOperatorPort> = {},
): ExternalSdkOperatorPort {
  return {
    changeOperatorStatus: vi.fn(() =>
      Promise.resolve(
        ok({ kind: "applied" as const, targetStatus: "break" as const, reasonId: 7 }),
      ),
    ),
    listOperatorReasons: vi.fn(() => [...REASONS]),
    readOcpSession: vi.fn(() => ({
      isAuthenticated: true,
      isLive: true,
      hasOperatorSnapshot: true,
    })),
    logoutAccountSession: vi.fn(() =>
      Promise.resolve(
        ok({
          ocpStep: "operator_logout" as const,
          sipSessionEnded: true as const,
          operatorSnapshotMissing: false,
        }),
      ),
    ),
    ...overrides,
  };
}

function createHandler(
  port: ExternalSdkOperatorPort = createPort(),
  createLogoutToken = () => "logout_token_fixed_001",
) {
  const revisionClock = new SdkSessionRevisionClock();
  const handler = new ExternalSdkOperatorHandler({
    operatorPort: port,
    revisionClock,
    createLogoutToken,
  });
  return { handler, revisionClock, port };
}

describe("ExternalSdkOperatorHandler", () => {
  it("denies without clientId as unauthenticated", async () => {
    const { handler } = createHandler();
    const result = await handler.handleCommand({
      ...BASE,
      type: "operator:get-reasons",
      requestId: "req_unauth_001",
      payload: {},
    });
    expect(result).toEqual({
      ok: false,
      code: "unauthenticated",
      retryable: false,
    });
  });

  it("returns public reasons without advancing revision", async () => {
    const { handler, revisionClock } = createHandler();
    const before = revisionClock.peek();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "operator:get-reasons",
        requestId: "req_reasons_001",
        payload: {},
      },
      { clientId: CLIENT },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.revision).toBe(before);
    expect(result.result).toEqual({
      reasons: [
        { id: 1, label: "Ready", kind: "ready" },
        { id: 7, label: "Break", kind: "break" },
        { id: 90, label: "End of shift", kind: "logout" },
      ],
    });
    expect(revisionClock.peek()).toBe(before);
  });

  it("SIP-only get-reasons returns empty list without fabricated OCP", async () => {
    const { handler } = createHandler(
      createPort({
        listOperatorReasons: () => [],
        readOcpSession: () => ({
          isAuthenticated: false,
          isLive: false,
          hasOperatorSnapshot: false,
        }),
      }),
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "operator:get-reasons",
        requestId: "req_sip_reasons_001",
        payload: {},
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: true,
      result: { reasons: [] },
      revision: 1,
    });
  });

  it("change-status advances revision and uses sdk port", async () => {
    const { handler, revisionClock, port } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "operator:change-status",
        requestId: "req_status_001",
        payload: { target: "break", reasonId: 7, expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.revision).toBe(2);
    expect(revisionClock.peek()).toBe(2);
    expect(port.changeOperatorStatus).toHaveBeenCalledWith({
      targetStatus: "break",
      reasonId: 7,
    });
  });

  it("change-status rejects SIP-only / missing OCP as not_found", async () => {
    const { handler } = createHandler(
      createPort({
        readOcpSession: () => ({
          isAuthenticated: false,
          isLive: false,
          hasOperatorSnapshot: false,
        }),
      }),
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "operator:change-status",
        requestId: "req_status_sip_001",
        payload: { target: "ready", expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
    });
  });

  it("change-status returns stale_state without advancing", async () => {
    const { handler, revisionClock } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "operator:change-status",
        requestId: "req_status_stale_001",
        payload: { target: "ready", expectedRevision: 99 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "stale_state",
      retryable: false,
      currentRevision: 1,
    });
    expect(revisionClock.peek()).toBe(1);
  });

  it("prepare-logout returns interaction_required with token + reasons", async () => {
    const { handler, revisionClock } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "interaction_required",
      retryable: false,
      details: {
        logoutToken: "logout_token_fixed_001",
        reasons: [{ id: 90, label: "End of shift", kind: "logout" }],
      },
    });
    expect(revisionClock.peek()).toBe(1);
  });

  it("SIP-only prepare-logout returns token without interaction", async () => {
    const { handler } = createHandler(
      createPort({
        listOperatorReasons: () => [],
        readOcpSession: () => ({
          isAuthenticated: false,
          isLive: false,
          hasOperatorSnapshot: false,
        }),
      }),
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_sip_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: true,
      result: { logoutToken: "logout_token_fixed_001", requiresReason: false },
      revision: 1,
    });
  });

  it("confirm-logout advances revision on success", async () => {
    const { handler, revisionClock, port } = createHandler();
    await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_002",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:confirm-logout",
        requestId: "req_confirm_001",
        payload: {
          logoutToken: "logout_token_fixed_001",
          reasonId: 90,
          expectedRevision: 1,
        },
      },
      { clientId: CLIENT },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.revision).toBe(2);
    expect(revisionClock.peek()).toBe(2);
    expect(port.logoutAccountSession).toHaveBeenCalledWith({ reasonId: 90 });
    expect(result.result).toEqual({
      loggedOut: true,
      ocpStep: "operator_logout",
      operatorSnapshotMissing: false,
    });
  });

  it("confirm missing reason returns interaction_required again", async () => {
    const { handler } = createHandler();
    await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_003",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:confirm-logout",
        requestId: "req_confirm_missing_001",
        payload: {
          logoutToken: "logout_token_fixed_001",
          expectedRevision: 1,
        },
      },
      { clientId: CLIENT },
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.code).toBe("interaction_required");
  });

  it("confirm invalid reason returns invalid_payload", async () => {
    const { handler } = createHandler();
    await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_004",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:confirm-logout",
        requestId: "req_confirm_bad_001",
        payload: {
          logoutToken: "logout_token_fixed_001",
          reasonId: 999,
          expectedRevision: 1,
        },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "invalid_payload",
      retryable: false,
    });
  });

  it("cancel pending logout does not call logoutAccountSession", async () => {
    const { handler, port } = createHandler();
    await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_005",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(handler.cancelPendingLogout("logout_token_fixed_001")).toBe(true);
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:confirm-logout",
        requestId: "req_confirm_cancel_001",
        payload: {
          logoutToken: "logout_token_fixed_001",
          reasonId: 90,
          expectedRevision: 1,
        },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
    });
    expect(port.logoutAccountSession).not.toHaveBeenCalled();
  });

  it("maps ocp_logout_reason_required to interaction_required", async () => {
    const { handler } = createHandler(
      createPort({
        listOperatorReasons: () => [],
        readOcpSession: () => ({
          isAuthenticated: true,
          isLive: true,
          hasOperatorSnapshot: true,
        }),
        logoutAccountSession: () =>
          Promise.resolve(
            err(
              createPlatformError(
                "validation_failed",
                "ocp_logout_reason_required",
                { reason: "ocp_logout_reason_required" },
              ),
            ),
          ),
      }),
    );
    await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_006",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:confirm-logout",
        requestId: "req_confirm_reason_001",
        payload: {
          logoutToken: "logout_token_fixed_001",
          expectedRevision: 1,
        },
      },
      { clientId: CLIENT },
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.code).toBe("interaction_required");
  });

  it("does not leak apiKey / OCP wire keys in replies", async () => {
    const { handler } = createHandler();
    const prepare = await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_leak_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const serialized = JSON.stringify(prepare);
    expect(serialized).not.toMatch(/apiKey/i);
    expect(serialized).not.toMatch(/ocpAuthToken/i);
    expect(serialized).not.toMatch(/password/i);
    expect(serialized).not.toMatch(/proxy_users/i);
  });

  it("abortClientSession clears pending logout without calling logout", async () => {
    const { handler, port } = createHandler();
    await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_abort_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(handler.clearPendingLogoutsForClient(CLIENT)).toBe(1);
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:confirm-logout",
        requestId: "req_confirm_abort_001",
        payload: {
          logoutToken: "logout_token_fixed_001",
          reasonId: 90,
          expectedRevision: 1,
        },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
    });
    expect(port.logoutAccountSession).not.toHaveBeenCalled();
  });

  it("prepare supersedes prior pending token for same client", async () => {
    let tokenSeq = 0;
    const { handler, port } = createHandler(createPort(), () => {
      tokenSeq += 1;
      return `logout_token_${tokenSeq}`;
    });
    await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_super_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    await handler.handleCommand(
      {
        ...BASE,
        type: "account:prepare-logout",
        requestId: "req_prep_super_002",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const stale = await handler.handleCommand(
      {
        ...BASE,
        type: "account:confirm-logout",
        requestId: "req_confirm_stale_tok",
        payload: {
          logoutToken: "logout_token_1",
          reasonId: 90,
          expectedRevision: 1,
        },
      },
      { clientId: CLIENT },
    );
    expect(stale).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
    });
    const fresh = await handler.handleCommand(
      {
        ...BASE,
        type: "account:confirm-logout",
        requestId: "req_confirm_fresh_tok",
        payload: {
          logoutToken: "logout_token_2",
          reasonId: 90,
          expectedRevision: 1,
        },
      },
      { clientId: CLIENT },
    );
    expect(fresh.ok).toBe(true);
    expect(port.logoutAccountSession).toHaveBeenCalledTimes(1);
  });
});

describe("ExternalSdkOperatorHandler shared revision clock", () => {
  it("snapshot revision is valid expectedRevision for operator mutate", async () => {
    const revisionClock = new SdkSessionRevisionClock();
    const ownership = new SdkCallOwnershipRegistry();
    const changeOperatorStatus = vi.fn(() =>
      Promise.resolve(
        ok({
          kind: "applied" as const,
          targetStatus: "break" as const,
          reasonId: 7,
        }),
      ),
    );
    const readHandler = new ExternalSdkReadHandler({
      readProductState: () => ({
        signedIn: true,
        profileLabel: null,
        registrationState: "registered",
        registrationReasonCode: null,
        calls: [],
        ocpEnabled: true,
        ocpConnected: true,
        operatorStatus: OperatorStatus.BREAK,
        operatorReasonId: 7,
        operatorReasonLabelKey: null,
      }),
      revisionClock,
      ownership,
    });
    const callHandler = new ExternalSdkCallHandler({
      callPort: {
        makeCall: vi.fn(),
        answerCall: vi.fn(),
        rejectCall: vi.fn(),
        hangupCall: vi.fn(),
        holdCall: vi.fn(),
        resumeCall: vi.fn(),
        muteCall: vi.fn(),
        unmuteCall: vi.fn(),
        sendDtmf: vi.fn(),
      },
      ownership,
      revisionClock,
    });
    const operatorHandler = new ExternalSdkOperatorHandler({
      operatorPort: {
        changeOperatorStatus,
        listOperatorReasons: () => [...REASONS],
        readOcpSession: () => ({
          isAuthenticated: true,
          isLive: true,
          hasOperatorSnapshot: true,
        }),
        logoutAccountSession: vi.fn(),
      },
      revisionClock,
    });
    const accountHandler = new ExternalSdkAccountHandler({
      accountPort: {
        activateSavedProfile: () =>
          Promise.resolve(
            err(createPlatformError("forbidden", "sdk_activate_not_used")),
          ),
      },
      revisionClock,
    });
    const product = new ExternalSdkProductHandler({
      readHandler,
      callHandler,
      operatorHandler,
      accountHandler,
    });

    const snapshot = await product.handleCommand(
      {
        ...BASE,
        type: "sdk:get-snapshot",
        requestId: "req_op_snap_001",
        payload: {},
      },
      { clientId: CLIENT },
    );
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) {
      return;
    }
    expect(snapshot.revision).toBe(1);

    const status = await product.handleCommand(
      {
        ...BASE,
        type: "operator:change-status",
        requestId: "req_op_status_shared",
        payload: {
          target: "break",
          reasonId: 7,
          expectedRevision: snapshot.revision,
        },
      },
      { clientId: CLIENT },
    );
    expect(status.ok).toBe(true);
    if (!status.ok) {
      return;
    }
    expect(status.revision).toBe(2);
    expect(revisionClock.peek()).toBe(2);
    expect(product.getRevision()).toBe(2);
    expect(changeOperatorStatus).toHaveBeenCalledOnce();
  });
});

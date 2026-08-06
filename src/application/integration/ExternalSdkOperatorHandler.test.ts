/**
 * DI-07: operator status + single-shot account:logout + revision contract.
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
import { ExternalSdkWindowHandler } from "./ExternalSdkWindowHandler.js";
import { SdkCallOwnershipRegistry } from "./SdkCallOwnershipRegistry.js";
import { SdkSessionRevisionCoordinator } from "./SdkSessionRevisionCoordinator.js";

function stubWindowHandler(
  revisionCoordinator: SdkSessionRevisionCoordinator,
): ExternalSdkWindowHandler {
  return new ExternalSdkWindowHandler({
    windowPort: {
      show: () => Promise.resolve({ ok: true, visible: true }),
      hide: () => Promise.resolve({ ok: true, visible: false }),
      getState: () => Promise.resolve({ ok: true, visible: true }),
    },
    revisionCoordinator,
  });
}

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
    finishPostCallAppeal: vi.fn(() =>
      Promise.resolve(
        ok({ kind: "applied" as const, targetStatus: "ready" as const, reasonId: 1 }),
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

function createHandler(port: ExternalSdkOperatorPort = createPort()) {
  const revisionCoordinator = new SdkSessionRevisionCoordinator();
  const handler = new ExternalSdkOperatorHandler({
    operatorPort: port,
    revisionCoordinator,
  });
  return { handler, revisionClock: revisionCoordinator, revisionCoordinator, port };
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

  it("finish-appeal advances revision when OCP authenticated in post-call", async () => {
    const { handler, revisionClock, port } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "operator:finish-appeal",
        requestId: "req_finish_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.revision).toBe(2);
    expect(revisionClock.peek()).toBe(2);
    expect(port.finishPostCallAppeal).toHaveBeenCalledTimes(1);
    expect(result.result).toEqual({
      accepted: true,
      kind: "applied",
      targetStatus: "ready",
      reasonId: 1,
    });
  });

  it("finish-appeal rejects missing OCP login as not_found", async () => {
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
        type: "operator:finish-appeal",
        requestId: "req_finish_sip_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
    });
  });

  it("finish-appeal outside post-call returns conflict with failure_kind", async () => {
    const { handler, revisionClock } = createHandler(
      createPort({
        finishPostCallAppeal: vi.fn(() =>
          Promise.resolve(
            err(
              createPlatformError(
                "validation_failed",
                "not_in_post_call_processing",
                { reason: "not_in_post_call_processing" },
              ),
            ),
          ),
        ),
      }),
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "operator:finish-appeal",
        requestId: "req_finish_wrong_status_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "conflict",
      retryable: false,
      details: { failure_kind: "not_in_post_call_processing" },
    });
    expect(revisionClock.peek()).toBe(1);
  });

  it("logout without reason returns interaction_required with reasons (no token)", async () => {
    const { handler, revisionClock, port } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:logout",
        requestId: "req_logout_missing_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "interaction_required",
      retryable: false,
      details: {
        requiresReason: true,
        reasons: [{ id: 90, label: "End of shift", kind: "logout" }],
      },
    });
    expect(revisionClock.peek()).toBe(1);
    expect(port.logoutAccountSession).not.toHaveBeenCalled();
  });

  it("SIP-only logout without reason succeeds and advances revision", async () => {
    const { handler, revisionClock, port } = createHandler(
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
        type: "account:logout",
        requestId: "req_logout_sip_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.revision).toBe(2);
    expect(revisionClock.peek()).toBe(2);
    expect(port.logoutAccountSession).toHaveBeenCalledWith({});
    expect(result.result).toEqual({
      loggedOut: true,
      ocpStep: "operator_logout",
      operatorSnapshotMissing: false,
    });
  });

  it("logout with reasonId advances revision on success", async () => {
    const { handler, revisionClock, port } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:logout",
        requestId: "req_logout_001",
        payload: {
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

  it("logout invalid reason returns invalid_payload", async () => {
    const { handler, port } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:logout",
        requestId: "req_logout_bad_001",
        payload: {
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
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:logout",
        requestId: "req_logout_reason_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.code).toBe("interaction_required");
  });

  it("does not leak apiKey / OCP wire keys / logoutToken in replies", async () => {
    const { handler } = createHandler();
    const reply = await handler.handleCommand(
      {
        ...BASE,
        type: "account:logout",
        requestId: "req_logout_leak_001",
        payload: { expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const serialized = JSON.stringify(reply);
    expect(serialized).not.toMatch(/apiKey/i);
    expect(serialized).not.toMatch(/ocpAuthToken/i);
    expect(serialized).not.toMatch(/password/i);
    expect(serialized).not.toMatch(/proxy_users/i);
    expect(serialized).not.toMatch(/logoutToken/i);
  });

  it("product abortClientSession is a no-op (no pending logout tokens)", () => {
    const { handler, port, revisionCoordinator } = createHandler();
    const product = new ExternalSdkProductHandler({
      readHandler: new ExternalSdkReadHandler({
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
        revisionCoordinator,
        ownership: new SdkCallOwnershipRegistry(),
      }),
      callHandler: new ExternalSdkCallHandler({
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
        ownership: new SdkCallOwnershipRegistry(),
        revisionCoordinator,
      }),
      operatorHandler: handler,
      accountHandler: new ExternalSdkAccountHandler({
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
        revisionCoordinator,
      }),
      windowHandler: stubWindowHandler(revisionCoordinator),
    });
    expect(product.abortClientSession("https://crm.example.com", CLIENT)).toBe(0);
    expect(port.logoutAccountSession).not.toHaveBeenCalled();
  });
});

describe("ExternalSdkOperatorHandler shared revision coordinator", () => {
  it("snapshot revision is valid expectedRevision for operator mutate", async () => {
    const revisionCoordinator = new SdkSessionRevisionCoordinator();
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
        reservedStatus: null,
        reservedReasonId: null,
        activeCampaign: null,
      }),
      revisionCoordinator,
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
      revisionCoordinator,
    });
    const operatorHandler = new ExternalSdkOperatorHandler({
      operatorPort: {
        changeOperatorStatus,
        finishPostCallAppeal: vi.fn(() =>
          Promise.resolve(
            ok({
              kind: "applied" as const,
              targetStatus: "ready" as const,
              reasonId: 1,
            }),
          ),
        ),
        listOperatorReasons: () => [...REASONS],
        readOcpSession: () => ({
          isAuthenticated: true,
          isLive: true,
          hasOperatorSnapshot: true,
        }),
        logoutAccountSession: vi.fn(),
      },
      revisionCoordinator,
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
      revisionCoordinator,
    });
    const product = new ExternalSdkProductHandler({
      readHandler,
      callHandler,
      operatorHandler,
      accountHandler,
      windowHandler: stubWindowHandler(revisionCoordinator),
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
    expect(revisionCoordinator.peek()).toBe(2);
    expect(product.getRevision()).toBe(2);
    expect(changeOperatorStatus).toHaveBeenCalledOnce();
  });
});

/**
 * DI-08 / DI-11: saved-profile activation — revision, logout-first, idempotency,
 * consent Allow/Deny/dismiss, pending guard, secrets off wire.
 */

import { describe, expect, it, vi } from "vitest";

import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE } from "@application/facades/accountSignInCommand.js";
import { ExternalSdkAccountHandler } from "./ExternalSdkAccountHandler.js";
import type {
  ExternalSdkAccountPort,
  SdkActivateProfileOutcome,
} from "./ExternalSdkAccountPort.js";
import type { SdkActivateConsentPort } from "./SdkActivateConsentPort.js";
import { SdkSessionRevisionCoordinator } from "./SdkSessionRevisionCoordinator.js";

const BASE = {
  protocolVersion: 1,
  kind: "command" as const,
  serverInstanceId: "srv_test_001",
  sessionEpoch: "epoch_test_001",
  occurredAt: "2026-07-20T09:00:00.000Z",
};

const CLIENT = "client_act_001";
const ORIGIN = "https://crm.example.com";
const LOGIN = "1001@pbx.example";

function createPort(
  overrides: Partial<ExternalSdkAccountPort> = {},
): ExternalSdkAccountPort {
  return {
    lookupSavedProfileByLogin: vi.fn(() =>
      Promise.resolve(
        ok({
          profileId: "profile_1001",
          profileLabel: "Agent 1001",
          username: LOGIN,
          availableModes: ["sip_only" as const],
        }),
      ),
    ),
    activateSavedProfileByLogin: vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    ),
    getActivateSessionView: () => ({
      signedIn: false,
      currentLogin: null,
      currentMode: null,
      profileLabel: null,
    }),
    ...overrides,
  };
}

function createHandler(
  port: ExternalSdkAccountPort = createPort(),
  extras: {
    consentPort?: SdkActivateConsentPort;
    isConsentPending?: () => boolean;
    onActivateConsentDenied?: (origin: string) => void;
  } = {},
) {
  const revisionCoordinator = new SdkSessionRevisionCoordinator();
  const handler = new ExternalSdkAccountHandler({
    accountPort: port,
    revisionCoordinator,
    ...extras,
  });
  return { handler, revisionClock: revisionCoordinator, revisionCoordinator, port };
}

describe("ExternalSdkAccountHandler", () => {
  it("denies without clientId as unauthenticated", async () => {
    const { handler } = createHandler();
    const result = await handler.handleCommand({
      ...BASE,
      type: "account:activate-profile",
      requestId: "req_unauth_act_001",
      payload: { login: LOGIN, expectedRevision: 1 },
    });
    expect(result).toEqual({
      ok: false,
      code: "unauthenticated",
      retryable: false,
    });
  });

  it("advances revision on success and returns public DTO only", async () => {
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    );
    const { handler, revisionClock } = createHandler(
      createPort({ activateSavedProfileByLogin }),
    );
    const before = revisionClock.peek();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_ok_001",
        payload: { login: LOGIN, expectedRevision: before },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: true,
      result: {
        activated: true,
        mode: "sip_only",
        profileLabel: "Agent 1001",
      },
      revision: before + 1,
    });
    expect(revisionClock.peek()).toBe(before + 1);
    expect(activateSavedProfileByLogin).toHaveBeenCalledWith(LOGIN, "sip_only");
    expect(JSON.stringify(result)).not.toMatch(/password|apiKey|secret/i);
  });

  it("returns stale_state without side effect when expectedRevision mismatches", async () => {
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    );
    const { handler, revisionClock } = createHandler(
      createPort({ activateSavedProfileByLogin }),
    );
    const current = revisionClock.peek();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_stale_001",
        payload: { login: LOGIN, expectedRevision: current + 5 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "stale_state",
      retryable: false,
      currentRevision: current,
    });
    expect(activateSavedProfileByLogin).not.toHaveBeenCalled();
    expect(revisionClock.peek()).toBe(current);
  });

  it("maps logout-first lock to conflict without advancing", async () => {
    const { handler, revisionClock } = createHandler(
      createPort({
        activateSavedProfileByLogin: () =>
          Promise.resolve(
            err(
              createPlatformError(
                "operation_failed",
                ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE,
                { reason: "account.signIn.disabled.logoutFirst" },
              ),
            ),
          ),
      }),
    );
    const before = revisionClock.peek();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_lock_001",
        payload: { login: LOGIN, expectedRevision: before },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "conflict",
      retryable: false,
      details: { logout_required: true },
    });
    expect(revisionClock.peek()).toBe(before);
  });

  it("caches duplicate requestId within TTL without second activate", async () => {
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    );
    const { handler } = createHandler(createPort({ activateSavedProfileByLogin }));
    const first = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_dup_001",
        payload: { login: LOGIN, expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const second = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_dup_001",
        payload: { login: LOGIN, expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(first).toEqual(second);
    expect(activateSavedProfileByLogin).toHaveBeenCalledTimes(1);
  });

  it("maps unknown profile to not_found", async () => {
    const { handler } = createHandler(
      createPort({
        lookupSavedProfileByLogin: () =>
          Promise.resolve(
            err(createPlatformError("not_found", "sdk_activate_account_not_found")),
          ),
      }),
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_nf_001",
        payload: { login: LOGIN, expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
      details: { account_not_found: true },
    });
  });

  it("pending guard returns conflict + activate_consent_pending without activate", async () => {
    const onDenied = vi.fn();
    const requestConsent = vi.fn(() =>
      Promise.resolve({ decision: "allow" as const, mode: "sip_only" as const }),
    );
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    );
    const consentPort: SdkActivateConsentPort = { requestConsent };
    const { handler } = createHandler(createPort({ activateSavedProfileByLogin }), {
      consentPort,
      isConsentPending: () => true,
      onActivateConsentDenied: onDenied,
    });
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_pending_001",
        payload: { login: LOGIN, expectedRevision: 1 },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    expect(result).toEqual({
      ok: false,
      code: "conflict",
      retryable: false,
      details: { activate_consent_pending: true },
    });
    expect(requestConsent).not.toHaveBeenCalled();
    expect(activateSavedProfileByLogin).not.toHaveBeenCalled();
    expect(onDenied).not.toHaveBeenCalled();
  });

  it("consent allow proceeds to login activation", async () => {
    const onDenied = vi.fn();
    const requestConsent = vi.fn(() =>
      Promise.resolve({ decision: "allow" as const, mode: "sip_only" as const }),
    );
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    );
    const consentPort: SdkActivateConsentPort = { requestConsent };
    const { handler, revisionClock } = createHandler(
      createPort({ activateSavedProfileByLogin }),
      {
        consentPort,
        isConsentPending: () => false,
        onActivateConsentDenied: onDenied,
      },
    );
    const before = revisionClock.peek();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_consent_allow_001",
        payload: { login: LOGIN, expectedRevision: before },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    expect(requestConsent).toHaveBeenCalledWith({
      origin: ORIGIN,
      kind: "activate",
      login: LOGIN,
      profileLabel: "Agent 1001",
      availableModes: ["sip_only"],
    });
    expect(activateSavedProfileByLogin).toHaveBeenCalledWith(LOGIN, "sip_only");
    expect(onDenied).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      result: {
        activated: true,
        mode: "sip_only",
        profileLabel: "Agent 1001",
      },
      revision: before + 1,
    });
  });

  it("consent deny persists via onActivateConsentDenied and returns forbidden", async () => {
    const onDenied = vi.fn();
    const requestConsent = vi.fn(() => Promise.resolve({ decision: "deny" as const }));
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    );
    const consentPort: SdkActivateConsentPort = { requestConsent };
    const { handler } = createHandler(createPort({ activateSavedProfileByLogin }), {
      consentPort,
      isConsentPending: () => false,
      onActivateConsentDenied: onDenied,
    });
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_consent_deny_001",
        payload: { login: LOGIN, expectedRevision: 1 },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    expect(onDenied).toHaveBeenCalledWith(ORIGIN);
    expect(activateSavedProfileByLogin).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: "forbidden",
      retryable: false,
      details: {
        permission_denied: true,
        activate_denied_for_origin: true,
      },
    });
  });

  it("consent dismiss clears path without onActivateConsentDenied", async () => {
    const onDenied = vi.fn();
    const requestConsent = vi.fn(() =>
      Promise.resolve({ decision: "dismiss" as const }),
    );
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    );
    const consentPort: SdkActivateConsentPort = { requestConsent };
    const { handler } = createHandler(createPort({ activateSavedProfileByLogin }), {
      consentPort,
      isConsentPending: () => false,
      onActivateConsentDenied: onDenied,
    });
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_consent_dismiss_001",
        payload: { login: LOGIN, expectedRevision: 1 },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    expect(onDenied).not.toHaveBeenCalled();
    expect(activateSavedProfileByLogin).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: "forbidden",
      retryable: false,
      details: {
        permission_denied: true,
        authorization_canceled_by_user: true,
      },
    });
  });

  it("consent TTL maps to timeout + activate_phase consent", async () => {
    const requestConsent = vi.fn(() =>
      Promise.resolve({ decision: "timeout" as const }),
    );
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    );
    const { handler } = createHandler(createPort({ activateSavedProfileByLogin }), {
      consentPort: { requestConsent },
      isConsentPending: () => false,
    });
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_consent_ttl_001",
        payload: { login: LOGIN, expectedRevision: 1 },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    expect(activateSavedProfileByLogin).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: "timeout",
      retryable: false,
      details: {
        activate_phase: "consent",
        failure_kind: "timeout",
      },
    });
  });

  it("maps ocp session_exist after Allow with failure_kind details", async () => {
    const requestConsent = vi.fn(() =>
      Promise.resolve({ decision: "allow" as const, mode: "ocp" as const }),
    );
    const { handler } = createHandler(
      createPort({
        lookupSavedProfileByLogin: () =>
          Promise.resolve(
            ok({
              profileId: "profile_1001",
              profileLabel: "Agent 1001",
              username: LOGIN,
              availableModes: ["ocp" as const],
            }),
          ),
        activateSavedProfileByLogin: () =>
          Promise.resolve(
            err(
              createPlatformError("operation_failed", "ocp_session_exist", {
                reason: "ocp_session_exist",
              }),
            ),
          ),
      }),
      {
        consentPort: { requestConsent },
        isConsentPending: () => false,
      },
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_session_exist_001",
        payload: { login: LOGIN, expectedRevision: 1, mode: "ocp" },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    expect(result).toEqual({
      ok: false,
      code: "operation_failed",
      retryable: false,
      details: {
        activate_phase: "sign_in",
        auth_mode: "ocp",
        failure_kind: "session_exist",
      },
    });
  });

  it("missing profile under consent path returns not_found before modal", async () => {
    const onDenied = vi.fn();
    const requestConsent = vi.fn(() =>
      Promise.resolve({ decision: "allow" as const, mode: "sip_only" as const }),
    );
    const consentPort: SdkActivateConsentPort = { requestConsent };
    const { handler } = createHandler(
      createPort({
        lookupSavedProfileByLogin: () =>
          Promise.resolve(
            err(createPlatformError("not_found", "sdk_activate_account_not_found")),
          ),
      }),
      {
        consentPort,
        isConsentPending: () => false,
        onActivateConsentDenied: onDenied,
      },
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_consent_nf_001",
        payload: { login: LOGIN, expectedRevision: 1 },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    expect(requestConsent).not.toHaveBeenCalled();
    expect(onDenied).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
      details: { account_not_found: true },
    });
  });

  it("cancels an activation when its exact client disconnects during consent", async () => {
    let resolveConsent!: (decision: { decision: "allow"; mode: "sip_only" }) => void;
    const activateSavedProfileByLogin = vi.fn(() =>
      Promise.resolve(ok({ mode: "sip_only" as const })),
    );
    const { handler, revisionCoordinator } = createHandler(
      createPort({ activateSavedProfileByLogin }),
      {
        consentPort: {
          requestConsent: () =>
            new Promise((resolve) => {
              resolveConsent = resolve;
            }),
        },
      },
    );
    const pending = handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_disconnect_consent_001",
        payload: { login: LOGIN, expectedRevision: revisionCoordinator.peek() },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    await vi.waitFor(() => {
      expect(resolveConsent).toBeTypeOf("function");
    });
    expect(handler.abortClientSession(ORIGIN, CLIENT)).toBe(1);
    resolveConsent({ decision: "allow", mode: "sip_only" });

    await expect(pending).resolves.toMatchObject({
      ok: false,
      code: "operation_failed",
    });
    expect(activateSavedProfileByLogin).not.toHaveBeenCalled();
    expect(revisionCoordinator.peek()).toBe(1);
  });

  it("rejects late authentication success after disconnect without advancing revision", async () => {
    let resolveAuth!: (
      value: ReturnType<typeof ok<SdkActivateProfileOutcome>>,
    ) => void;
    const cancelInFlightActivateSignIn = vi.fn();
    const { handler, revisionCoordinator } = createHandler(
      createPort({
        activateSavedProfileByLogin: () =>
          new Promise((resolve) => {
            resolveAuth = resolve;
          }),
        cancelInFlightActivateSignIn,
      }),
    );
    const pending = handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_disconnect_auth_001",
        payload: { login: LOGIN, expectedRevision: revisionCoordinator.peek() },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    await vi.waitFor(() => {
      expect(resolveAuth).toBeTypeOf("function");
    });
    expect(handler.abortClientSession(ORIGIN, CLIENT)).toBe(1);

    await expect(pending).resolves.toMatchObject({
      ok: false,
      code: "operation_failed",
    });
    resolveAuth(ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }));
    await Promise.resolve();
    expect(cancelInFlightActivateSignIn).toHaveBeenCalledWith("sip_only");
    expect(revisionCoordinator.peek()).toBe(1);
  });

  it("does not cancel a completed activation after its revision commit", async () => {
    const { handler, revisionCoordinator } = createHandler();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_committed_001",
        payload: { login: LOGIN, expectedRevision: revisionCoordinator.peek() },
      },
      { clientId: CLIENT, origin: ORIGIN },
    );
    expect(result.ok).toBe(true);
    expect(handler.abortClientSession(ORIGIN, CLIENT)).toBe(0);
    expect(revisionCoordinator.peek()).toBe(2);
  });
});

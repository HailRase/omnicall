/**
 * DI-08: saved-profile activation — revision, logout-first, idempotency, secrets off wire.
 */

import { describe, expect, it, vi } from "vitest";

import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE } from "@application/facades/accountSignInCommand.js";
import { encodeSdkProfileRef } from "@shared/integration/sdkProfileRefCodec.js";

import { ExternalSdkAccountHandler } from "./ExternalSdkAccountHandler.js";
import type { ExternalSdkAccountPort } from "./ExternalSdkAccountPort.js";
import { SdkSessionRevisionClock } from "./SdkSessionRevisionClock.js";

const BASE = {
  protocolVersion: 1,
  kind: "command" as const,
  serverInstanceId: "srv_test_001",
  sessionEpoch: "epoch_test_001",
  occurredAt: "2026-07-20T09:00:00.000Z",
};

const CLIENT = "client_act_001";
const PROFILE_ID = "1001@pbx.example";
const PROFILE_REF = encodeSdkProfileRef(PROFILE_ID)!;

function createPort(
  overrides: Partial<ExternalSdkAccountPort> = {},
): ExternalSdkAccountPort {
  return {
    activateSavedProfile: vi.fn(() =>
      Promise.resolve(
        ok({ mode: "sip_only" as const, profileLabel: "Agent 1001" }),
      ),
    ),
    ...overrides,
  };
}

function createHandler(port: ExternalSdkAccountPort = createPort()) {
  const revisionClock = new SdkSessionRevisionClock();
  const handler = new ExternalSdkAccountHandler({
    accountPort: port,
    revisionClock,
  });
  return { handler, revisionClock, port };
}

describe("ExternalSdkAccountHandler", () => {
  it("denies without clientId as unauthenticated", async () => {
    const { handler } = createHandler();
    const result = await handler.handleCommand({
      ...BASE,
      type: "account:activate-profile",
      requestId: "req_unauth_act_001",
      payload: { profileRef: PROFILE_REF, expectedRevision: 1 },
    });
    expect(result).toEqual({
      ok: false,
      code: "unauthenticated",
      retryable: false,
    });
  });

  it("advances revision on success and returns public DTO only", async () => {
    const { handler, revisionClock, port } = createHandler();
    const before = revisionClock.peek();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_ok_001",
        payload: { profileRef: PROFILE_REF, expectedRevision: before },
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
    expect(port.activateSavedProfile).toHaveBeenCalledWith(PROFILE_REF);
    expect(JSON.stringify(result)).not.toMatch(/password|apiKey|secret/i);
  });

  it("returns stale_state without side effect when expectedRevision mismatches", async () => {
    const { handler, revisionClock, port } = createHandler();
    const current = revisionClock.peek();
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_stale_001",
        payload: { profileRef: PROFILE_REF, expectedRevision: current + 5 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "stale_state",
      retryable: false,
      currentRevision: current,
    });
    expect(port.activateSavedProfile).not.toHaveBeenCalled();
    expect(revisionClock.peek()).toBe(current);
  });

  it("maps logout-first lock to conflict without advancing", async () => {
    const { handler, revisionClock } = createHandler(
      createPort({
        activateSavedProfile: () =>
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
        payload: { profileRef: PROFILE_REF, expectedRevision: before },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "conflict",
      retryable: false,
    });
    expect(revisionClock.peek()).toBe(before);
  });

  it("caches duplicate requestId within TTL without second activate", async () => {
    const { handler, port } = createHandler();
    const first = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_dup_001",
        payload: { profileRef: PROFILE_REF, expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    const second = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_dup_001",
        payload: { profileRef: PROFILE_REF, expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(first).toEqual(second);
    expect(port.activateSavedProfile).toHaveBeenCalledTimes(1);
  });

  it("maps unknown profile to not_found", async () => {
    const { handler } = createHandler(
      createPort({
        activateSavedProfile: () =>
          Promise.resolve(
            err(createPlatformError("not_found", "sdk_activate_profile_not_found")),
          ),
      }),
    );
    const result = await handler.handleCommand(
      {
        ...BASE,
        type: "account:activate-profile",
        requestId: "req_act_nf_001",
        payload: { profileRef: PROFILE_REF, expectedRevision: 1 },
      },
      { clientId: CLIENT },
    );
    expect(result).toEqual({
      ok: false,
      code: "not_found",
      retryable: false,
    });
  });
});

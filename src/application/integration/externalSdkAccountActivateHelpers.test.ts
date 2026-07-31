/**
 * Unit tests for activate auth-budget race + error mapping.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";

import type { ExternalSdkAccountPort } from "./ExternalSdkAccountPort.js";
import {
  activateSavedProfileWithAuthBudget,
  consentTimeoutFailure,
  mapActivateError,
} from "./externalSdkAccountActivateHelpers.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("externalSdkAccountActivateHelpers", () => {
  it("maps consent timeout failure", () => {
    expect(consentTimeoutFailure()).toEqual({
      ok: false,
      code: "timeout",
      retryable: false,
      details: {
        activate_phase: "consent",
        failure_kind: "timeout",
      },
    });
  });

  it("maps ocp_session_exist to operation_failed + failure_kind", () => {
    expect(
      mapActivateError(
        createPlatformError("operation_failed", "ocp_session_exist", {
          reason: "ocp_session_exist",
        }),
        { activatePhase: "sign_in", authMode: "ocp" },
      ),
    ).toEqual({
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

  it("maps stage timeout messages to timeout + sign_in details", () => {
    expect(
      mapActivateError(
        createPlatformError("timeout", "ocp_auth_timeout", {
          reason: "ocp_auth_timeout",
        }),
        { activatePhase: "sign_in", authMode: "ocp" },
      ),
    ).toEqual({
      ok: false,
      code: "timeout",
      retryable: false,
      details: {
        activate_phase: "sign_in",
        auth_mode: "ocp",
        failure_kind: "timeout",
      },
    });
  });

  it("cancels OCP activate when auth budget expires", async () => {
    vi.useFakeTimers();
    const cancelInFlightActivateSignIn = vi.fn(() => Promise.resolve());
    let resolveActivate: ((value: ReturnType<typeof ok>) => void) | undefined;
    const port: ExternalSdkAccountPort = {
      lookupSavedProfileByLogin: () =>
        Promise.resolve(
          err(createPlatformError("not_found", "sdk_activate_account_not_found")),
        ),
      activateSavedProfileByLogin: () =>
        new Promise((resolve) => {
          resolveActivate = resolve as (value: ReturnType<typeof ok>) => void;
        }),
      cancelInFlightActivateSignIn,
      getActivateSessionView: () => ({
        signedIn: false,
        currentLogin: null,
        currentMode: null,
        profileLabel: null,
      }),
    };

    const pending = activateSavedProfileWithAuthBudget(
      port,
      "1001",
      "ocp",
      (callback, ms) => {
        const handle = setTimeout(callback, ms);
        return { clear: () => clearTimeout(handle) };
      },
    );

    await vi.advanceTimersByTimeAsync(115_000);
    const result = await pending;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("sdk_activate_sign_in_timeout");
    }
    expect(cancelInFlightActivateSignIn).toHaveBeenCalledWith("ocp");
    resolveActivate?.(ok({ mode: "ocp" as const }));
  });
});

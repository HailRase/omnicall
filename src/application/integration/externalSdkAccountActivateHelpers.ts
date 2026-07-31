/**
 * Activate error mapping + auth-budget race helpers (DI-08 / ADR-0018 timeout sync).
 */

import type { WireJsonObject } from "@softomnitel/omnicall-protocol";
import { ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE } from "@application/facades/accountSignInCommand.js";
import { mapAuthorizationFailureKind } from "@application/projections/settings/authorizationProgressProjection.js";
import type { ExternalHandlerResult } from "@ports/integration/ExternalCommandHandler.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";

import type {
  ExternalSdkAccountPort,
  SdkActivateMode,
  SdkActivateProfileOutcome,
} from "./ExternalSdkAccountPort.js";
import { sdkFail } from "./externalSdkCallHelpers.js";
import { mapPlatformErrorToSdkCode } from "./mapPlatformErrorToSdkCode.js";
import { sdkActivateAuthBudgetMs } from "./sdkActivateTimeouts.js";

export type ActivateErrorContext = Readonly<{
  activatePhase?: "consent" | "sign_in";
  authMode?: SdkActivateMode;
}>;

export function mapActivateError(
  error: PlatformError,
  context?: ActivateErrorContext,
): ExternalHandlerResult {
  if (error.message === ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE) {
    return sdkFail("conflict", { logout_required: true });
  }
  if (error.message === "sdk_activate_account_not_found") {
    return sdkFail("not_found", { account_not_found: true });
  }
  if (error.message === "sdk_activate_account_incomplete") {
    return sdkFail("not_found", { account_incomplete: true });
  }
  if (error.message === "sdk_activate_account_ambiguous") {
    return sdkFail("conflict", { account_ambiguous: true });
  }

  const failureKind = mapAuthorizationFailureKind(error.message);
  const timedOut =
    error.code === "timeout" ||
    failureKind === "timeout" ||
    failureKind === "credentials_timeout" ||
    error.message === "sdk_activate_sign_in_timeout" ||
    error.message === "sdk_activate_consent_timeout";

  const code = timedOut ? "timeout" : mapPlatformErrorToSdkCode(error);
  const details: WireJsonObject = {
    activate_phase: context?.activatePhase ?? "sign_in",
    failure_kind: failureKind,
    ...(context?.authMode !== undefined ? { auth_mode: context.authMode } : {}),
  };
  return {
    ok: false,
    code,
    retryable: false,
    details,
  };
}

export function consentTimeoutFailure(): ExternalHandlerResult {
  return sdkFail("timeout", {
    activate_phase: "consent",
    failure_kind: "timeout",
  });
}

/**
 * Race saved-profile activate against the mode auth budget; cancel OCP on expiry.
 */
export async function activateSavedProfileWithAuthBudget(
  accountPort: ExternalSdkAccountPort,
  login: string,
  mode: SdkActivateMode,
  scheduleTimeout: (
    callback: () => void,
    ms: number,
  ) => { readonly clear: () => void } = (callback, ms) => {
    const handle = setTimeout(callback, ms);
    return { clear: () => clearTimeout(handle) };
  },
): Promise<Result<SdkActivateProfileOutcome, PlatformError>> {
  const budgetMs = sdkActivateAuthBudgetMs(mode);
  let settled = false;
  let clearTimer: (() => void) | undefined;

  const timeoutResult = new Promise<Result<SdkActivateProfileOutcome, PlatformError>>(
    (resolve) => {
      const timer = scheduleTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        void Promise.resolve(accountPort.cancelInFlightActivateSignIn?.(mode)).finally(
          () => {
            resolve(
              err(
                createPlatformError("timeout", "sdk_activate_sign_in_timeout", {
                  reason: "sdk_activate_sign_in_timeout",
                }),
              ),
            );
          },
        );
      }, budgetMs);
      clearTimer = timer.clear;
    },
  );

  try {
    const result = await Promise.race([
      accountPort.activateSavedProfileByLogin(login, mode).then((value) => {
        if (!settled) {
          settled = true;
          return value;
        }
        return err(
          createPlatformError("timeout", "sdk_activate_sign_in_timeout", {
            reason: "sdk_activate_sign_in_timeout",
          }),
        );
      }),
      timeoutResult,
    ]);
    return result.ok ? ok(result.value) : result;
  } finally {
    clearTimer?.();
  }
}

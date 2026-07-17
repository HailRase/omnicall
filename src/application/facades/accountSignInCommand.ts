/**
 * - Purpose: typed Account sign-in command contract (ADR-AF-003 / WU-03).
 * - Inputs: mode, profile identity, non-secret fields, boundary-only secrets, save prefs.
 * - Outputs: validation result with semantic reason keys (never localized sentences).
 */

import type { SavedAccountProfileId } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";

/** Local UI intent — not a SIP account type. */
export type AccountSignInMode = "sip_only" | "ocp";

export type AccountSignInProfileRef =
  | Readonly<{ kind: "new_draft" }>
  | Readonly<{ kind: "saved"; profileId: SavedAccountProfileId }>;

export type AccountSignInSavePreferences = Readonly<{
  saveProfile?: boolean;
  rememberPassword?: boolean;
  saveOcpApiKey?: boolean;
}>;

/**
 * Secure values (`sipPassword`, `ocpApiKey`) exist only at the call boundary.
 * They must never enter projections, attempt context snapshots, or logs.
 */
export type AccountSignInCommand = Readonly<{
  mode: AccountSignInMode;
  profile: AccountSignInProfileRef;
  sip?: Readonly<{
    username: string;
    domain: string;
    server: string;
    /** Boundary-only; omit when using remembered secret for a saved profile. */
    password?: string;
  }>;
  ocp?: Readonly<{
    login: string;
    domain?: string;
    /** Boundary-only; omit when profile already has a saved API key. */
    apiKey?: string;
  }>;
  save?: AccountSignInSavePreferences;
  correlationId?: CorrelationId;
}>;

export type AccountSignInRejectReasonKey =
  | "account.signIn.disabled.logoutFirst"
  | "account.signIn.validation.sipFieldsRequired"
  | "account.signIn.validation.ocpLoginRequired"
  | "account.signIn.validation.ocpConfigRequired"
  | "account.signIn.validation.savedProfileRequired"
  | "account.signIn.validation.unsupportedMode";

export const ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE =
  "account_sign_in_logout_required" as const;

export function createAccountSignInLogoutRequiredError(): PlatformError {
  return createPlatformError(
    "operation_failed",
    ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE,
    { reason: "account.signIn.disabled.logoutFirst" satisfies AccountSignInRejectReasonKey },
  );
}

export function createAccountSignInValidationError(
  reason: Exclude<AccountSignInRejectReasonKey, "account.signIn.disabled.logoutFirst">,
): PlatformError {
  return createPlatformError("validation_failed", reason, { reason });
}

/**
 * - Purpose: validate Account sign-in command shape at the Application boundary.
 * - Modes are isolated: SIP-only never requires OCP fields; OCP never requires SIP password/server.
 */
export function validateAccountSignInCommand(
  command: AccountSignInCommand,
): Result<void, PlatformError> {
  if (command.mode !== "sip_only" && command.mode !== "ocp") {
    return err(createAccountSignInValidationError("account.signIn.validation.unsupportedMode"));
  }

  if (command.profile.kind === "saved" && command.profile.profileId.trim().length === 0) {
    return err(
      createAccountSignInValidationError("account.signIn.validation.savedProfileRequired"),
    );
  }

  if (command.mode === "sip_only") {
    if (command.profile.kind === "saved") {
      return ok(undefined);
    }
    const sip = command.sip;
    if (
      sip === undefined ||
      sip.username.trim().length === 0 ||
      sip.domain.trim().length === 0 ||
      sip.server.trim().length === 0 ||
      (sip.password ?? "").trim().length === 0
    ) {
      return err(
        createAccountSignInValidationError("account.signIn.validation.sipFieldsRequired"),
      );
    }
    return ok(undefined);
  }

  // OCP mode: only `command.ocp` (plus saved-profile secret hydration later). Ignore SIP-only fields.
  const login = command.ocp?.login.trim() ?? "";
  if (login.length === 0) {
    return err(createAccountSignInValidationError("account.signIn.validation.ocpLoginRequired"));
  }

  if (command.profile.kind === "new_draft") {
    const domain = command.ocp?.domain?.trim() ?? "";
    const apiKey = command.ocp?.apiKey?.trim() ?? "";
    if (domain.length === 0 || apiKey.length === 0) {
      return err(
        createAccountSignInValidationError("account.signIn.validation.ocpConfigRequired"),
      );
    }
  }

  return ok(undefined);
}

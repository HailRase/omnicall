/**
 * - Purpose: pure helpers for Account sign-in hook (WU-04).
 * - Inputs: form/mode/profile flags and facade outcomes.
 * - Outputs: command fragments, visibility flags, warning keys — no I/O.
 */

import type { AccountSignInCommand } from "@application/facades/accountSignInCommand.js";
import type { AuthorizeAccountOutcome } from "@application/facades/AccountBootstrapFacade.js";
import type {
  OcpRecoveryAction,
  SipAccountInput,
  SavedAccountProfileId,
} from "@application/index.js";
import type { TranslationKey } from "../i18n/messages.js";

export type AccountUiSignInMode = "sip_only" | "ocp";

export type OcpDraftFields = Readonly<{
  login: string;
  domain: string;
  apiKey: string;
}>;

const PROFILE_SAVE_WARNING_KEY = "account.warning.profileSaveFailed" as const;
const PROFILE_TOUCH_WARNING_KEY = "account.warning.profileTouchFailed" as const;
const PASSWORD_SAVE_WARNING_KEY = "account.warning.passwordSaveFailed" as const;

export function resolveMetadataWarningKey(
  outcome: AuthorizeAccountOutcome,
): TranslationKey | null {
  if (outcome.metadataWarnings.includes("profile_save_failed")) {
    return PROFILE_SAVE_WARNING_KEY;
  }
  if (outcome.metadataWarnings.includes("profile_touch_failed")) {
    return PROFILE_TOUCH_WARNING_KEY;
  }
  if (outcome.metadataWarnings.includes("password_save_failed")) {
    return PASSWORD_SAVE_WARNING_KEY;
  }
  return null;
}

export function recoveryActionTestId(action: OcpRecoveryAction): string {
  if (action === "retry_server") {
    return "account-retry-server";
  }
  if (action === "retry_authorization") {
    return "account-retry-authorization";
  }
  return "account-reconnect";
}

export function recoveryActionLabelKey(action: OcpRecoveryAction): TranslationKey {
  if (action === "retry_server") {
    return "account.recovery.retryServer";
  }
  if (action === "retry_authorization") {
    return "account.recovery.retryAuthorization";
  }
  return "account.recovery.reconnect";
}

/**
 * - Purpose: decide which OCP config inputs remain visible for a selected profile.
 */
export function deriveOcpConfigFieldVisibility(input: Readonly<{
  selectedProfileId: SavedAccountProfileId | null;
  hasCompleteOcpConfiguration: boolean;
  hasSavedOcpApiKey: boolean;
  ocpDomain: string | undefined;
}>): Readonly<{
  showDomain: boolean;
  showApiKey: boolean;
}> {
  void input;
  return { showDomain: true, showApiKey: true };
}

/**
 * - Purpose: build typed AccountSignInCommand for Facade (secrets only at boundary).
 */
export function buildAccountSignInCommand(input: Readonly<{
  mode: AccountUiSignInMode;
  selectedProfileId: SavedAccountProfileId | null;
  form: SipAccountInput;
  ocp: OcpDraftFields;
  saveProfile: boolean;
  rememberPassword: boolean;
  passwordFieldVisible: boolean;
  showOcpDomain: boolean;
  showOcpApiKey: boolean;
  overwriteExistingCredentials?: boolean;
  authenticateAsNewDraft?: boolean;
}>): AccountSignInCommand {
  const profile =
    input.selectedProfileId === null || input.authenticateAsNewDraft === true
      ? ({ kind: "new_draft" } as const)
      : ({ kind: "saved", profileId: input.selectedProfileId } as const);

  void input.showOcpDomain;

  const saveOcpApiKey =
    input.mode === "ocp" &&
    (input.saveProfile || input.overwriteExistingCredentials) &&
    input.ocp.apiKey.trim().length > 0;

  if (input.mode === "sip_only") {
    const usedRemembered =
      input.selectedProfileId !== null && !input.passwordFieldVisible;
    const sipSave = {
      ...(input.saveProfile || input.overwriteExistingCredentials
        ? { saveProfile: true }
        : {}),
      ...(input.rememberPassword ||
      (input.overwriteExistingCredentials && input.form.password.trim().length > 0)
        ? { rememberPassword: true }
        : {}),
    };
    return {
      mode: "sip_only",
      profile,
      sip: {
        username: input.form.username,
        domain: input.form.domain,
        server: input.form.server,
        ...(usedRemembered ? {} : { password: input.form.password }),
      },
      ...(Object.keys(sipSave).length > 0 ? { save: sipSave } : {}),
    };
  }

  const login = input.ocp.login.trim();
  const ocpDomain = input.ocp.domain.trim();
  const apiKey = input.ocp.apiKey.trim();
  // OCP sign-in must not depend on SIP-only form leftovers (password/server).
  // Provisional SIP identity is OCP login/domain only until entity:creds; Application
  // rewrites saved SIP domain/server/password from creds after SIP-ready (ADR-AF-001).
  const provisionalSipDomain = ocpDomain;
  const provisionalSipServer =
    provisionalSipDomain.length > 0 ? `sip:${provisionalSipDomain}` : "";
  // Remember-password without a boundary SIP password is deferred until entity:creds —
  // keep the opt-in flag so Facade can persist the creds password after register.
  const boundarySipPassword = input.form.password.trim();
  const ocpSave = {
    ...(input.saveProfile || input.overwriteExistingCredentials
      ? { saveProfile: true }
      : {}),
    ...(input.rememberPassword ? { rememberPassword: true } : {}),
    ...(saveOcpApiKey ? { saveOcpApiKey: true } : {}),
  };

  return {
    mode: "ocp",
    profile,
    ocp: {
      login,
      ...(ocpDomain.length > 0 ? { domain: ocpDomain } : {}),
      ...(apiKey.length > 0 ? { apiKey } : {}),
    },
    ...(login.length > 0 || provisionalSipDomain.length > 0
      ? {
          sip: {
            username: login,
            domain: provisionalSipDomain,
            server: provisionalSipServer,
            ...(boundarySipPassword.length > 0 ? { password: boundarySipPassword } : {}),
          },
        }
      : {}),
    ...(Object.keys(ocpSave).length > 0 ? { save: ocpSave } : {}),
  };
}

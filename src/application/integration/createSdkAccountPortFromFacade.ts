/**
 * Bind Facade → ExternalSdkAccountPort (login activate path).
 */

import {
  isDraftSavedAccountProfile,
  type SavedAccountProfile,
} from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import {
  sdkAccountLoginsMatch,
  trimSdkAccountLogin,
} from "@shared/integration/sdkAccountLogin.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { AccountSignInCommand } from "@application/facades/accountSignInCommand.js";

import type {
  ExternalSdkAccountPort,
  SdkActivateMode,
  SdkActivateProfileLookup,
  SdkActivateProfileOutcome,
  SdkActivateSessionView,
} from "./ExternalSdkAccountPort.js";

const PROFILE_NOT_FOUND = "sdk_activate_account_not_found" as const;
const PROFILE_INCOMPLETE = "sdk_activate_account_incomplete" as const;
const PROFILE_AMBIGUOUS = "sdk_activate_account_ambiguous" as const;
const PROFILE_NOT_APPROVED = "sdk_activate_profile_not_approved" as const;

export type CreateSdkAccountPortFromFacadeOptions = Readonly<{
  facade: AccountBootstrapFacade;
  /** When false/undefined, OCP saved profiles modes are unavailable. */
  ocpModuleEnabled?: boolean;
  getActivateSessionView: () => SdkActivateSessionView;
}>;

/**
 * - Purpose: map login → saved profile activate without wire secrets.
 */
export function createSdkAccountPortFromFacade(
  options: CreateSdkAccountPortFromFacadeOptions,
): ExternalSdkAccountPort {
  return {
    lookupSavedProfileByLogin: (login) =>
      lookupSavedProfileByLoginViaFacade(options, login),
    activateSavedProfileByLogin: (login, mode) =>
      activateSavedProfileByLoginViaFacade(options, login, mode),
    cancelInFlightActivateSignIn: async (mode) => {
      if (mode !== "ocp") {
        return;
      }
      await options.facade.cancelOcpSignInAttempt();
    },
    getActivateSessionView: () => options.getActivateSessionView(),
  };
}

async function lookupSavedProfileByLoginViaFacade(
  options: CreateSdkAccountPortFromFacadeOptions,
  login: string,
): Promise<Result<SdkActivateProfileLookup, PlatformError>> {
  const match = await findApprovedProfileForLogin(options, login);
  if (!match.ok) {
    return match;
  }
  const availability = await options.facade.resolveSavedAccountProfileAvailability(
    match.value.id,
  );
  if (isErr(availability)) {
    return availability;
  }
  const availableModes = resolveAvailableModes({
    profile: match.value,
    hasSavedSipPassword: availability.value.hasSavedSipPassword,
    hasCompleteOcpConfiguration: availability.value.hasCompleteOcpConfiguration,
    ocpModuleEnabled: options.ocpModuleEnabled === true,
  });
  if (availableModes.length === 0) {
    return err(createPlatformError("not_found", PROFILE_INCOMPLETE));
  }
  const label =
    match.value.displayName.trim().length > 0
      ? match.value.displayName.trim().slice(0, 128)
      : match.value.username.trim().slice(0, 128);
  return ok({
    profileId: match.value.id,
    profileLabel: label.length > 0 ? label : "profile",
    username: match.value.username,
    availableModes,
  });
}

async function activateSavedProfileByLoginViaFacade(
  options: CreateSdkAccountPortFromFacadeOptions,
  login: string,
  mode: SdkActivateMode,
): Promise<Result<SdkActivateProfileOutcome, PlatformError>> {
  const match = await findApprovedProfileForLogin(options, login);
  if (!match.ok) {
    return match;
  }
  const availability = await options.facade.resolveSavedAccountProfileAvailability(
    match.value.id,
  );
  if (isErr(availability)) {
    return availability;
  }
  const availableModes = resolveAvailableModes({
    profile: match.value,
    hasSavedSipPassword: availability.value.hasSavedSipPassword,
    hasCompleteOcpConfiguration: availability.value.hasCompleteOcpConfiguration,
    ocpModuleEnabled: options.ocpModuleEnabled === true,
  });
  if (!availableModes.includes(mode)) {
    return err(createPlatformError("not_found", PROFILE_INCOMPLETE));
  }

  const command = buildActivateCommand(match.value, mode);
  if (!command.ok) {
    return command;
  }

  const signIn = await options.facade.signInAccount(command.value);
  if (isErr(signIn)) {
    return signIn;
  }

  return ok({
    mode,
    ...(match.value.displayName.trim().length > 0
      ? { profileLabel: match.value.displayName.trim().slice(0, 128) }
      : {}),
  });
}

async function findApprovedProfileForLogin(
  options: CreateSdkAccountPortFromFacadeOptions,
  login: string,
): Promise<Result<SavedAccountProfile, PlatformError>> {
  const trimmed = trimSdkAccountLogin(login);
  if (trimmed.length === 0) {
    return err(createPlatformError("not_found", PROFILE_NOT_FOUND));
  }
  const profilesResult = await options.facade.listSavedAccountProfiles();
  if (isErr(profilesResult)) {
    return profilesResult;
  }
  const matches = profilesResult.value.filter(
    (entry) =>
      !isDraftSavedAccountProfile(entry) &&
      sdkAccountLoginsMatch(trimmed, entry.username),
  );
  if (matches.length === 0) {
    const anyDraft = profilesResult.value.some(
      (entry) =>
        isDraftSavedAccountProfile(entry) &&
        sdkAccountLoginsMatch(trimmed, entry.username),
    );
    if (anyDraft) {
      return err(createPlatformError("forbidden", PROFILE_NOT_APPROVED));
    }
    return err(createPlatformError("not_found", PROFILE_NOT_FOUND));
  }
  if (matches.length > 1) {
    const sorted = [...matches].sort((a, b) => {
      const aUsed = a.lastUsedAt ?? a.successfulUseAt ?? a.createdAt ?? "";
      const bUsed = b.lastUsedAt ?? b.successfulUseAt ?? b.createdAt ?? "";
      return bUsed.localeCompare(aUsed);
    });
    const primary = sorted[0];
    if (primary === undefined) {
      return err(createPlatformError("not_found", PROFILE_AMBIGUOUS));
    }
    return ok(primary);
  }
  return ok(matches[0]!);
}

function resolveAvailableModes(input: {
  readonly profile: SavedAccountProfile;
  readonly hasSavedSipPassword: boolean;
  readonly hasCompleteOcpConfiguration: boolean;
  readonly ocpModuleEnabled: boolean;
}): readonly SdkActivateMode[] {
  const modes: SdkActivateMode[] = [];
  const domain = input.profile.domain.trim();
  const server = input.profile.server.trim();
  if (input.hasSavedSipPassword && domain.length > 0 && server.length > 0) {
    modes.push("sip_only");
  }
  if (input.ocpModuleEnabled && input.hasCompleteOcpConfiguration) {
    modes.push("ocp");
  }
  return modes;
}

function buildActivateCommand(
  profile: SavedAccountProfile,
  mode: SdkActivateMode,
): Result<AccountSignInCommand, PlatformError> {
  if (mode === "ocp") {
    const ocpDomain = profile.ocpDomain?.trim() ?? "";
    if (ocpDomain.length === 0) {
      return err(createPlatformError("not_found", PROFILE_INCOMPLETE));
    }
    return ok({
      mode: "ocp",
      profile: { kind: "saved", profileId: profile.id },
      ocp: {
        login: profile.username,
        domain: ocpDomain,
      },
    });
  }
  return ok({
    mode: "sip_only",
    profile: { kind: "saved", profileId: profile.id },
  });
}

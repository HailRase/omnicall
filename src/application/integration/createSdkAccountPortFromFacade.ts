/**
 * Bind Facade → ExternalSdkAccountPort (DI-08). No protocol parsing here.
 */

import {
  createSavedAccountProfileId,
  isDraftSavedAccountProfile,
  type SavedAccountProfile,
} from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { decodeSdkProfileRef } from "@shared/integration/sdkProfileRefCodec.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { AccountSignInCommand } from "@application/facades/accountSignInCommand.js";

import type {
  ExternalSdkAccountPort,
  SdkActivateProfileOutcome,
} from "./ExternalSdkAccountPort.js";

const PROFILE_NOT_FOUND = "sdk_activate_profile_not_found" as const;
const PROFILE_NOT_APPROVED = "sdk_activate_profile_not_approved" as const;

export type CreateSdkAccountPortFromFacadeOptions = Readonly<{
  facade: AccountBootstrapFacade;
  /** When false/undefined, OCP saved profiles are rejected (SIP-only safe). */
  ocpModuleEnabled?: boolean;
}>;

/**
 * - Purpose: map opaque profileRef to unified Account sign-in without wire secrets.
 */
export function createSdkAccountPortFromFacade(
  options: CreateSdkAccountPortFromFacadeOptions,
): ExternalSdkAccountPort {
  return {
    activateSavedProfile: (profileRef) =>
      activateSavedProfileViaFacade(options, profileRef),
    lookupSavedProfileLabel: (profileRef) =>
      lookupSavedProfileLabelViaFacade(options, profileRef),
  };
}

async function lookupSavedProfileLabelViaFacade(
  options: CreateSdkAccountPortFromFacadeOptions,
  profileRef: string,
): Promise<Result<{ profileLabel: string }, PlatformError>> {
  const profile = await findApprovedSavedProfile(options, profileRef);
  if (!profile.ok) {
    return profile;
  }
  const label =
    profile.value.displayName.trim().length > 0
      ? profile.value.displayName.trim().slice(0, 128)
      : profile.value.username.trim().slice(0, 128);
  return ok({ profileLabel: label.length > 0 ? label : "profile" });
}

async function findApprovedSavedProfile(
  options: CreateSdkAccountPortFromFacadeOptions,
  profileRef: string,
): Promise<Result<SavedAccountProfile, PlatformError>> {
  const profileIdRaw = decodeSdkProfileRef(profileRef);
  if (profileIdRaw === null) {
    return err(createPlatformError("not_found", PROFILE_NOT_FOUND));
  }
  const profileId = createSavedAccountProfileId(profileIdRaw);
  const profilesResult = await options.facade.listSavedAccountProfiles();
  if (isErr(profilesResult)) {
    return profilesResult;
  }
  const profile = profilesResult.value.find((entry) => entry.id === profileId);
  if (profile === undefined) {
    return err(createPlatformError("not_found", PROFILE_NOT_FOUND));
  }
  if (isDraftSavedAccountProfile(profile)) {
    return err(createPlatformError("forbidden", PROFILE_NOT_APPROVED));
  }
  return ok(profile);
}

async function activateSavedProfileViaFacade(
  options: CreateSdkAccountPortFromFacadeOptions,
  profileRef: string,
): Promise<Result<SdkActivateProfileOutcome, PlatformError>> {
  const profileResult = await findApprovedSavedProfile(options, profileRef);
  if (!profileResult.ok) {
    return profileResult;
  }
  const profile = profileResult.value;

  const command = buildActivateCommand(profile, options.ocpModuleEnabled === true);
  if (!command.ok) {
    return command;
  }

  const signIn = await options.facade.signInAccount(command.value);
  if (isErr(signIn)) {
    return signIn;
  }

  return ok({
    mode: command.value.mode,
    ...(profile.displayName.trim().length > 0
      ? { profileLabel: profile.displayName.trim().slice(0, 128) }
      : {}),
  });
}

function buildActivateCommand(
  profile: SavedAccountProfile,
  ocpModuleEnabled: boolean,
): Result<AccountSignInCommand, PlatformError> {
  const ocpDomain = profile.ocpDomain?.trim() ?? "";
  if (ocpDomain.length > 0) {
    if (!ocpModuleEnabled) {
      return err(createPlatformError("forbidden", PROFILE_NOT_APPROVED));
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

/**
 * - Purpose: resolve which settings/account bucket receives OCP domain + api-key for a connect login.
 * - Inputs: typed login string + saved SIP profiles (no secrets).
 * - Outputs: existing profile key, provisional username-only key for new login, or validation failure.
 */

import {
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
} from "../../settings/deriveLegacyUsernameOnlySettingsAccountKey.js";
import { normalizeSettingsAccountUsername } from "../../settings/deriveSettingsAccountKey.js";
import type { SavedAccountProfile } from "../../settings/SavedAccountProfile.js";
import type { SettingsAccountKey } from "../../settings/SettingsAccountKey.js";

export type OcpConnectLoginOption = Readonly<{
  login: string;
  accountKey: SettingsAccountKey;
  displayName: string;
}>;

export type OcpConnectLoginTarget =
  | Readonly<{
      kind: "existing";
      login: string;
      accountKey: SettingsAccountKey;
    }>
  | Readonly<{
      kind: "new";
      login: string;
      accountKey: SettingsAccountKey;
    }>;

export type OcpConnectLoginTargetResult =
  | Readonly<{ ok: true; value: OcpConnectLoginTarget }>
  | Readonly<{
      ok: false;
      reason: "login_required" | "login_ambiguous";
    }>;

/**
 * - Purpose: build presentational login picker options from saved profiles.
 * - Inputs: saved account profiles (unique ids).
 * - Outputs: ordered options (username as login label).
 */
export function buildOcpConnectLoginOptions(
  profiles: ReadonlyArray<SavedAccountProfile>,
): ReadonlyArray<OcpConnectLoginOption> {
  return profiles.map((profile) => ({
    login: profile.username,
    accountKey: profile.id,
    displayName:
      profile.displayName.trim().length > 0
        ? profile.displayName
        : profile.username,
  }));
}

/**
 * - Purpose: map a typed/selected OCP login to settings accountKey without mutating SIP session.
 * - Inputs: raw login, saved profiles; optional explicit accountKey disambiguates same username.
 * - Outputs: existing | new target, or login_required / login_ambiguous.
 */
export function resolveOcpConnectLoginTarget(
  login: string,
  profiles: ReadonlyArray<SavedAccountProfile>,
  explicitAccountKey?: SettingsAccountKey,
): OcpConnectLoginTargetResult {
  const trimmedLogin = login.trim();
  if (trimmedLogin.length === 0) {
    return { ok: false, reason: "login_required" };
  }

  if (explicitAccountKey !== undefined) {
    const byKey = profiles.find((profile) => profile.id === explicitAccountKey);
    if (byKey !== undefined) {
      return {
        ok: true,
        value: {
          kind: "existing",
          login: byKey.username.trim().length > 0 ? byKey.username.trim() : trimmedLogin,
          accountKey: byKey.id,
        },
      };
    }
  }

  const normalizedLogin = normalizeSettingsAccountUsername(trimmedLogin);
  const matches = profiles.filter(
    (profile) =>
      normalizeSettingsAccountUsername(profile.username) === normalizedLogin,
  );

  if (matches.length > 1) {
    return { ok: false, reason: "login_ambiguous" };
  }

  if (matches.length === 1) {
    const profile = matches[0];
    if (profile === undefined) {
      return { ok: false, reason: "login_required" };
    }
    return {
      ok: true,
      value: {
        kind: "existing",
        login: profile.username.trim(),
        accountKey: profile.id,
      },
    };
  }

  return {
    ok: true,
    value: {
      kind: "new",
      login: trimmedLogin,
      accountKey: deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity({
        username: trimmedLogin,
        domain: "",
        server: "",
      }),
    },
  };
}

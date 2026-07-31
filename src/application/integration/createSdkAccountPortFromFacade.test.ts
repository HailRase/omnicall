/**
 * DI-11: login-based saved-profile activation via the account facade.
 */

import { describe, expect, it, vi } from "vitest";

import { createSavedAccountProfile, type SavedAccountProfile } from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE } from "@application/facades/accountSignInCommand.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";

import { createSdkAccountPortFromFacade } from "./createSdkAccountPortFromFacade.js";

const SIGNED_OUT_SESSION = {
  signedIn: false,
  currentLogin: null,
  currentMode: null,
  profileLabel: null,
} as const;

function createFacade(
  profile: SavedAccountProfile,
  signInAccount: unknown = vi.fn(() =>
    Promise.resolve(ok({ kind: "sip_ready" as const })),
  ),
  availability: unknown = {
    hasSavedSipPassword: true,
    hasCompleteOcpConfiguration: false,
  },
): AccountBootstrapFacade {
  return {
    listSavedAccountProfiles: () => Promise.resolve(ok([profile])),
    resolveSavedAccountProfileAvailability: () =>
      Promise.resolve(ok(availability)),
    signInAccount,
  } as never;
}

describe("createSdkAccountPortFromFacade", () => {
  it("activates SIP-only saved profile without password on the command", async () => {
    const profile = createSavedAccountProfile(
      {
        username: "1001",
        domain: "pbx.example",
        server: "wss://sip.example",
      },
      { lifecycleStatus: "successful", successfulUseAt: "2026-07-20T10:00:00.000Z" },
    );
    expect(profile.ok).toBe(true);
    if (!profile.ok) {
      return;
    }
    const signInAccount = vi.fn(() =>
      Promise.resolve(ok({ kind: "sip_ready" as const })),
    );
    const port = createSdkAccountPortFromFacade({
      facade: createFacade(profile.value, signInAccount),
      ocpModuleEnabled: false,
      getActivateSessionView: () => SIGNED_OUT_SESSION,
    });
    const result = await port.activateSavedProfileByLogin("1001", "sip_only");
    expect(result.ok).toBe(true);
    expect(signInAccount).toHaveBeenCalledWith({
      mode: "sip_only",
      profile: { kind: "saved", profileId: profile.value.id },
    });
    expect(JSON.stringify(signInAccount.mock.calls)).not.toMatch(
      /password|apiKey|secret/i,
    );
  });

  it("rejects draft profiles as forbidden", async () => {
    const profile = createSavedAccountProfile({
      username: "1001",
      domain: "pbx.example",
      server: "wss://sip.example",
    });
    expect(profile.ok).toBe(true);
    if (!profile.ok) {
      return;
    }
    const signInAccount = vi.fn();
    const port = createSdkAccountPortFromFacade({
      facade: createFacade(profile.value, signInAccount),
      getActivateSessionView: () => SIGNED_OUT_SESSION,
    });
    const result = await port.activateSavedProfileByLogin("1001", "sip_only");
    expect(result).toEqual(
      err(createPlatformError("forbidden", "sdk_activate_profile_not_approved")),
    );
    expect(signInAccount).not.toHaveBeenCalled();
  });

  it("propagates logout-first lock from Facade", async () => {
    const profile = createSavedAccountProfile(
      {
        username: "1001",
        domain: "pbx.example",
        server: "wss://sip.example",
      },
      { lifecycleStatus: "successful", successfulUseAt: "2026-07-20T10:00:00.000Z" },
    );
    expect(profile.ok).toBe(true);
    if (!profile.ok) {
      return;
    }
    const port = createSdkAccountPortFromFacade({
      facade: createFacade(profile.value, () =>
        Promise.resolve(
          err(
            createPlatformError(
              "operation_failed",
              ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE,
            ),
          ),
        ),
      ),
      getActivateSessionView: () => SIGNED_OUT_SESSION,
    });
    const result = await port.activateSavedProfileByLogin("1001", "sip_only");
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe(ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE);
  });

  it("rejects OCP saved profile when OCP module is disabled", async () => {
    const created = createSavedAccountProfile(
      {
        username: "agent1",
        domain: "ocp.example",
        server: "sip:ocp.example",
      },
      {
        lifecycleStatus: "successful",
        successfulUseAt: "2026-07-20T10:00:00.000Z",
        ocpDomain: "ocp.example",
      },
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const signInAccount = vi.fn();
    const port = createSdkAccountPortFromFacade({
      facade: createFacade(created.value, signInAccount, {
        hasSavedSipPassword: true,
        hasCompleteOcpConfiguration: true,
      }),
      ocpModuleEnabled: false,
      getActivateSessionView: () => SIGNED_OUT_SESSION,
    });
    const result = await port.activateSavedProfileByLogin("agent1", "ocp");
    expect(result).toEqual(
      err(createPlatformError("not_found", "sdk_activate_account_incomplete")),
    );
    expect(signInAccount).not.toHaveBeenCalled();
  });

  it("activates OCP saved profile with login/domain only when OCP enabled", async () => {
    const created = createSavedAccountProfile(
      {
        username: "agent1",
        domain: "ocp.example",
        server: "sip:ocp.example",
      },
      {
        lifecycleStatus: "successful",
        successfulUseAt: "2026-07-20T10:00:00.000Z",
        ocpDomain: "ocp.example",
      },
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const signInAccount = vi.fn(() =>
      Promise.resolve(ok({ kind: "sip_ready" as const })),
    );
    const port = createSdkAccountPortFromFacade({
      facade: createFacade(created.value, signInAccount, {
        hasSavedSipPassword: true,
        hasCompleteOcpConfiguration: true,
      }),
      ocpModuleEnabled: true,
      getActivateSessionView: () => SIGNED_OUT_SESSION,
    });
    const result = await port.activateSavedProfileByLogin("agent1", "ocp");
    expect(result.ok).toBe(true);
    expect(signInAccount).toHaveBeenCalledWith({
      mode: "ocp",
      profile: { kind: "saved", profileId: created.value.id },
      ocp: { login: "agent1", domain: "ocp.example" },
    });
    expect(JSON.stringify(signInAccount.mock.calls)).not.toMatch(/apiKey|password/i);
  });
});

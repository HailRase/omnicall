import { describe, expect, it } from "vitest";
import {
  authorizedOcpAuthorizationState,
  idleOcpAuthorizationState,
  rejectedOcpAuthorizationState,
  timeoutOcpAuthorizationState,
} from "@domain/integration/ocp/OcpAuthorizationState.js";
import { createSettingsAccountKey, type SavedAccountProfile } from "@domain/index.js";
import {
  deriveAccountOcpProfileOptions,
  deriveAccountSignInViewModel,
  deriveAllowedAccountRecoveryActions,
  toAccountSignInSelectedProfileView,
} from "./accountSignInViewModel.js";
import type { SavedAccountProfileAvailabilityView } from "./deriveSavedAccountProfileAvailability.js";

function profile(
  id: string,
  username: string,
  ocpDomain?: string,
): SavedAccountProfile {
  return {
    id: createSettingsAccountKey(id),
    username,
    domain: "pbx.example",
    server: "sip:pbx.example",
    displayName: username,
    createdAt: "2026-07-01T00:00:00.000Z",
    lastUsedAt: "2026-07-01T00:00:00.000Z",
    lifecycleStatus: "successful",
    ...(ocpDomain !== undefined ? { ocpDomain } : {}),
  };
}

function availability(
  saved: SavedAccountProfile,
  flags: Readonly<{
    hasSavedSipPassword?: boolean;
    hasSavedOcpApiKey?: boolean;
    hasCompleteOcpConfiguration?: boolean;
    isDraft?: boolean;
  }> = {},
): SavedAccountProfileAvailabilityView {
  return {
    profile: saved,
    hasSavedSipPassword: flags.hasSavedSipPassword === true,
    hasSavedOcpApiKey: flags.hasSavedOcpApiKey === true,
    hasCompleteOcpConfiguration: flags.hasCompleteOcpConfiguration === true,
    isDraft: flags.isDraft === true,
  };
}

describe("accountSignInViewModel", () => {
  it("never exposes secret strings and distinguishes complete OCP profiles", () => {
    const rows = [
      availability(profile("p-sip", "1001"), { hasSavedSipPassword: true }),
      availability(profile("p-ocp", "1002", "ocp.example"), {
        hasSavedOcpApiKey: true,
        hasCompleteOcpConfiguration: true,
      }),
      availability(profile("p-incomplete", "1003", "ocp.example"), {
        hasSavedOcpApiKey: false,
        hasCompleteOcpConfiguration: false,
      }),
    ];

    const vm = deriveAccountSignInViewModel({
      isSipRegistered: false,
      hasActiveAccountSession: false,
      availabilities: rows,
      selectedProfileId: createSettingsAccountKey("p-ocp"),
      dualFsm: {
        serverState: "disconnected",
        authorizationState: idleOcpAuthorizationState(),
        terminalSessionClosed: false,
      },
    });

    expect(vm.sipProfileOptions.map((o) => o.id)).toEqual([
      createSettingsAccountKey("p-sip"),
      createSettingsAccountKey("p-ocp"),
      createSettingsAccountKey("p-incomplete"),
    ]);
    expect(vm.ocpProfileOptions.map((o) => o.id)).toEqual([
      createSettingsAccountKey("p-ocp"),
    ]);
    expect(deriveAccountOcpProfileOptions(rows).map((o) => o.id)).toEqual([
      createSettingsAccountKey("p-ocp"),
    ]);
    expect(vm.selectedProfile).toEqual({
      profileId: createSettingsAccountKey("p-ocp"),
      username: "1002",
      domain: "pbx.example",
      server: "sip:pbx.example",
      ocpDomain: "ocp.example",
      hasSavedSipPassword: false,
      hasSavedOcpApiKey: true,
      hasCompleteOcpConfiguration: true,
      isDraft: false,
    });
    expect(JSON.stringify(vm)).not.toContain("secret");
    expect(JSON.stringify(vm)).not.toContain("Bearer");
  });

  it("disables login with logoutFirst reason when account session is active", () => {
    const vm = deriveAccountSignInViewModel({
      isSipRegistered: false,
      hasActiveAccountSession: true,
      availabilities: [],
      selectedProfileId: null,
      dualFsm: {
        serverState: "connected",
        authorizationState: authorizedOcpAuthorizationState(),
        terminalSessionClosed: false,
      },
    });
    expect(vm.loginDisabledReason).toBe("account.signIn.disabled.logoutFirst");
    expect(vm.hasActiveAccountSession).toBe(true);
    expect(vm.selectedProfile).toBeNull();
  });

  it("lists dual-FSM recovery actions without inventing unauthorized ones", () => {
    const authTimeout = {
      serverState: "connected" as const,
      authorizationState: timeoutOcpAuthorizationState(),
      terminalSessionClosed: false,
    };
    expect(deriveAllowedAccountRecoveryActions(authTimeout)).toEqual([
      "retry_authorization",
    ]);

    const sessionExist = {
      serverState: "connected" as const,
      authorizationState: rejectedOcpAuthorizationState("SESSION_EXIST"),
      terminalSessionClosed: false,
    };
    expect(deriveAllowedAccountRecoveryActions(sessionExist)).toEqual(["retry_server"]);

    const vm = deriveAccountSignInViewModel({
      isSipRegistered: false,
      hasActiveAccountSession: false,
      availabilities: [],
      selectedProfileId: null,
      dualFsm: sessionExist,
    });
    expect(vm.primaryRecoveryAction).toBe("retry_server");
    expect(vm.allowedRecoveryActions).toEqual(["retry_server"]);
  });

  it("maps null availability to null selected profile view", () => {
    expect(toAccountSignInSelectedProfileView(null)).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";
import { MockMediaGateway } from "@adapters/mock/MockMediaGateway.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { MockOcpProxyAuthenticatePort } from "@adapters/mock/MockOcpProxyAuthenticatePort.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { InMemorySavedAccountProfileRepository } from "@adapters/settings/InMemorySavedAccountProfileRepository.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import {
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
  createSecretStorageScopeKey,
} from "@ports/secrets/SecretStoragePort.js";
import { deriveSavedAccountProfileId } from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { isErr } from "@shared/result/index.js";
import { AccountBootstrapFacade } from "./AccountBootstrapFacade.js";

describe("AccountBootstrapFacade account sign-in (WU-03)", () => {
  it("signInAccount sip_only succeeds for a new draft", async () => {
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      logger: createTestLogger(),
    });

    const result = await facade.signInAccount({
      mode: "sip_only",
      profile: { kind: "new_draft" },
      sip: {
        username: "1001",
        domain: "pbx.example",
        server: "sip:pbx.example",
        password: "secret",
      },
    });
    expect(result.ok).toBe(true);
  });

  it("signInAccount rejects same and other identity while SIP is registered", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      logger: createTestLogger(),
    });

    await facade.signInAccount({
      mode: "sip_only",
      profile: { kind: "new_draft" },
      sip: {
        username: "1001",
        domain: "pbx.example",
        server: "sip:pbx.example",
        password: "secret-a",
      },
    });

    const endSessionSpy = vi.spyOn(facade.endUserSession, "execute");
    const same = await facade.signInAccount({
      mode: "sip_only",
      profile: { kind: "new_draft" },
      sip: {
        username: "1001",
        domain: "pbx.example",
        server: "sip:pbx.example",
        password: "secret-a",
      },
    });
    const other = await facade.signInAccount({
      mode: "sip_only",
      profile: { kind: "new_draft" },
      sip: {
        username: "1002",
        domain: "pbx.example",
        server: "sip:pbx.example",
        password: "secret-b",
      },
    });

    expect(isErr(same)).toBe(true);
    expect(isErr(other)).toBe(true);
    if (isErr(same)) {
      expect(same.error.message).toBe("account_sign_in_logout_required");
    }
    expect(endSessionSpy).not.toHaveBeenCalled();
    expect(telephony.isRegistered()).toBe(true);
  });

  it("getAccountSignInViewModel never returns secrets and marks login disabled when registered", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const profiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      savedAccountProfileRepository: profiles,
      secretStoragePort: secrets,
      logger: createTestLogger(),
    });

    const saved = await facade.saveSavedAccountProfile({
      username: "1002",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }

    await profiles.saveProfile(
      {
        username: "1002",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
      { ocpDomain: "ocp.example", lifecycleStatus: "successful" },
    );
    await secrets.saveSecret(
      createSecretStorageScopeKey(saved.value.id),
      OCP_PROXY_API_KEY_SECRET_ID,
      "super-secret-api-key",
    );

    await facade.signInAccount({
      mode: "sip_only",
      profile: { kind: "new_draft" },
      sip: {
        username: "1001",
        domain: "pbx.example",
        server: "sip:pbx.example",
        password: "secret",
      },
    });

    const vm = await facade.getAccountSignInViewModel({
      selectedProfileId: saved.value.id,
    });
    expect(vm.ok).toBe(true);
    if (!vm.ok) {
      return;
    }
    expect(vm.value.loginDisabledReason).toBe("account.signIn.disabled.logoutFirst");
    expect(vm.value.selectedProfile?.hasCompleteOcpConfiguration).toBe(true);
    expect(vm.value.selectedProfile?.hasSavedOcpApiKey).toBe(true);
    expect(JSON.stringify(vm.value)).not.toContain("super-secret-api-key");
    expect(JSON.stringify(vm.value)).not.toContain("secret");
  });

  it("signInAccount ocp path reaches SIP-ready for a new draft", async () => {
    const gateway = new MockOcpGateway();
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      secretStoragePort: new InMemorySecretStorageAdapter(),
      savedAccountProfileRepository: new InMemorySavedAccountProfileRepository(),
      logger: createTestLogger(),
    });

    const pending = facade.signInAccount({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "1001",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
      save: { saveOcpApiKey: true, saveProfile: true },
      sip: {
        username: "1001",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    await expect(settings.getActiveProfileKey()).resolves.not.toBeNull();
    gateway.simulateAuthSuccessWithCredentials(1, {
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
  });

  it("signInAccount ocp new draft ignores empty SIP fields and rememberPassword without password", async () => {
    const gateway = new MockOcpGateway();
    const secrets = new InMemorySecretStorageAdapter();
    const profiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      secretStoragePort: secrets,
      savedAccountProfileRepository: profiles,
      logger: createTestLogger(),
    });

    const pending = facade.signInAccount({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "agent",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
      save: {
        saveProfile: true,
        rememberPassword: true,
        saveOcpApiKey: true,
      },
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(1, {
      username: "agent",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
    const profileId = deriveSavedAccountProfileId({
      username: "agent",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    await expect(
      secrets.loadSecret(
        createSecretStorageScopeKey(profileId),
        SIP_PASSWORD_SECRET_ID,
      ),
    ).resolves.toBe("test-sip-password");
  });

  it("signInAccount ocp saveProfile persists SIP domain/server from entity:creds not OCP Domain", async () => {
    const gateway = new MockOcpGateway();
    const secrets = new InMemorySecretStorageAdapter();
    const profiles = new InMemorySavedAccountProfileRepository();
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      secretStoragePort: secrets,
      savedAccountProfileRepository: profiles,
      logger: createTestLogger(),
    });

    const pending = facade.signInAccount({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "max.supervisor",
        domain: "ocp-proxy.example",
        apiKey: "proxy-key",
      },
      // Production UI sends provisional SIP identity = OCP host until creds arrive.
      sip: {
        username: "max.supervisor",
        domain: "ocp-proxy.example",
        server: "sip:ocp-proxy.example",
      },
      save: {
        saveProfile: true,
        rememberPassword: true,
        saveOcpApiKey: true,
      },
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(1, {
      username: "max.supervisor",
      password: "Hso_2kJ7P7De",
      domain: "dev-qms.onedemoserver.online",
      server: "onedemoserver.online",
    });

    const result = await pending;
    expect(result.ok).toBe(true);

    const sipProfileId = deriveSavedAccountProfileId({
      username: "max.supervisor",
      domain: "dev-qms.onedemoserver.online",
      server: "onedemoserver.online",
    });
    const provisionalOcpProfileId = deriveSavedAccountProfileId({
      username: "max.supervisor",
      domain: "ocp-proxy.example",
      server: "sip:ocp-proxy.example",
    });

    const saved = await profiles.getProfileById(sipProfileId);
    expect(saved).not.toBeNull();
    expect(saved?.domain).toBe("dev-qms.onedemoserver.online");
    expect(saved?.server).toBe("onedemoserver.online");
    expect(saved?.ocpDomain).toBe("ocp-proxy.example");
    expect(saved?.lifecycleStatus).toBe("successful");

    await expect(profiles.getProfileById(provisionalOcpProfileId)).resolves.toBeNull();

    await expect(
      secrets.loadSecret(
        createSecretStorageScopeKey(sipProfileId),
        SIP_PASSWORD_SECRET_ID,
      ),
    ).resolves.toBe("Hso_2kJ7P7De");

    const account = await settings.getSipAccount();
    expect(account?.domain).toBe("dev-qms.onedemoserver.online");
    expect(account?.server).toBe("onedemoserver.online");
  });

  it("dispatchAccountRecoveryAction rejects actions not allowed by dual FSM", async () => {
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      logger: createTestLogger(),
    });

    const result = await facade.dispatchAccountRecoveryAction("retry_authorization");
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe("authorization_retry_unavailable");
    }
  });

  it("failed OCP sign-in activates account session; modal recovery does not call new Login", async () => {
    const gateway = new MockOcpGateway();
    const proxy = new MockOcpProxyAuthenticatePort();
    proxy.setBehavior({
      kind: "error",
      error: createPlatformError("operation_failed", "ocp_unavailable", {
        reason: "ocp_unavailable",
      }),
    });
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      ocpGateway: gateway,
      ocpProxyAuthenticate: proxy,
      secretStoragePort: new InMemorySecretStorageAdapter(),
      savedAccountProfileRepository: new InMemorySavedAccountProfileRepository(),
      logger: createTestLogger(),
    });

    const signIn = await facade.signInAccount({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "1001",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
      save: { saveOcpApiKey: true, saveProfile: true },
    });
    expect(signIn.ok).toBe(false);
    await expect(settings.getActiveProfileKey()).resolves.not.toBeNull();

    const signInAgain = await facade.signInAccount({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "1001",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
    });
    expect(isErr(signInAgain)).toBe(true);
    if (isErr(signInAgain)) {
      expect(signInAgain.error.message).toBe("account_sign_in_logout_required");
    }

    // Recovery while session active uses dedicated entry (not identity gate).
    proxy.setBehavior({ kind: "token", token: "tok-recovery" });
    const recoverPending = facade.recoverOcpSignInFromModal();
    const progress =
      facade.getOcpSessionSnapshot().authorizationProgress.executionStage;
    expect(progress).toBe("requesting_authorization_token");

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(1, {
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const recover = await recoverPending;
    expect(recover.ok).toBe(true);
  });

  it("cancelOcpSignInAttempt returns OCP idle and clears account session for Login", async () => {
    const gateway = new MockOcpGateway();
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      secretStoragePort: new InMemorySecretStorageAdapter(),
      savedAccountProfileRepository: new InMemorySavedAccountProfileRepository(),
      logger: createTestLogger(),
    });

    const pending = facade.signInAccount({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "1001",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
      save: { saveOcpApiKey: true, saveProfile: true },
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    await expect(settings.getActiveProfileKey()).resolves.not.toBeNull();

    const cancel = await facade.cancelOcpSignInAttempt();
    expect(cancel.ok).toBe(true);
    const session = facade.getOcpSessionSnapshot();
    expect(session.serverState).toBe("disconnected");
    expect(session.authorizationState.phase).toBe("idle");
    expect(session.activeAttemptId).toBeNull();
    expect(session.authorizationProgress.stage).toBe("idle");

    const vm = await facade.getAccountSignInViewModel();
    expect(vm.ok).toBe(true);
    if (vm.ok) {
      expect(vm.value.hasActiveAccountSession).toBe(false);
      expect(vm.value.loginDisabledReason).toBeNull();
    }

    await pending;
  });
});

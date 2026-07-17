// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import {
  createReadyAccountSignInOutcome,
  createSettingsAccountKey,
  createSipRegistrationFailedAccountSignInOutcome,
  type SavedAccountProfile,
} from "@application/index.js";
import type { AccountSignInViewModel } from "@application/projections/settings/accountSignInViewModel.js";
import { initialAuthorizationProgressProjection } from "@application/projections/settings/authorizationProgressProjection.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { initialAccountBootstrapProjection } from "@application/projections/settings/accountBootstrapProjection.js";
import { useAccountActions, type AccountActionsFacadeBinding } from "./useAccountActions.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

const savedProfileFixture: SavedAccountProfile = {
  id: createSettingsAccountKey("1001@pbx.example.com"),
  username: "1001",
  domain: "pbx.example.com",
  server: "wss://sip.example.com",
  displayName: "1001",
  lifecycleStatus: "successful",
};

function createSignInViewModel(
  overrides: Partial<AccountSignInViewModel> = {},
): AccountSignInViewModel {
  return {
    isSipRegistered: false,
    hasActiveAccountSession: false,
    loginDisabledReason: null,
    sipProfileOptions: [{ id: savedProfileFixture.id, label: "1001" }],
    ocpProfileOptions: [],
    selectedProfile: null,
    serverState: "disconnected",
    authorizationState: { phase: "idle" },
    authorizationProgress: initialAuthorizationProgressProjection(),
    primaryRecoveryAction: null,
    allowedRecoveryActions: [],
    ...overrides,
  };
}

function createFacadeMock(
  options: Readonly<{
    hasRememberedSipPassword?: boolean;
    sipPassword?: string | null;
    ocpApiKey?: string | null;
  }> = {},
): {
  facade: AccountActionsFacadeBinding;
  signInAccount: ReturnType<typeof vi.fn>;
  listSavedAccountProfiles: ReturnType<typeof vi.fn>;
  hasRememberedSipPassword: ReturnType<typeof vi.fn>;
  forgetRememberedSipPassword: ReturnType<typeof vi.fn>;
  getActiveSipAccount: ReturnType<typeof vi.fn>;
  getAccountSignInViewModel: ReturnType<typeof vi.fn>;
  dispatchAccountRecoveryAction: ReturnType<typeof vi.fn>;
} {
  const signInAccount = vi
    .fn()
    .mockResolvedValue(ok(createReadyAccountSignInOutcome()));
  const listSavedAccountProfiles = vi.fn().mockResolvedValue(ok([savedProfileFixture]));
  const hasRememberedSipPassword = vi
    .fn()
    .mockResolvedValue(options.hasRememberedSipPassword ?? false);
  const forgetRememberedSipPassword = vi.fn().mockResolvedValue(ok(undefined));
  const loadSavedAccountProfileSecrets = vi.fn().mockResolvedValue(
    ok({
      sipPassword: options.sipPassword ?? null,
      ocpApiKey: options.ocpApiKey ?? null,
    }),
  );
  const getActiveSipAccount = vi.fn().mockResolvedValue(null);
  const getAccountSignInViewModel = vi.fn().mockResolvedValue(ok(createSignInViewModel()));
  const dispatchAccountRecoveryAction = vi.fn().mockResolvedValue(ok(undefined));

  const facade = {
    listSavedAccountProfiles,
    signInAccount,
    getAccountSignInViewModel,
    dispatchAccountRecoveryAction,
    deleteSavedAccountProfile: vi.fn().mockResolvedValue(ok(undefined)),
    hasRememberedSipPassword,
    loadSavedAccountProfileSecrets,
    forgetRememberedSipPassword,
    getActiveSipAccount,
  } satisfies AccountActionsFacadeBinding;

  return {
    facade,
    signInAccount,
    listSavedAccountProfiles,
    hasRememberedSipPassword,
    forgetRememberedSipPassword,
    getActiveSipAccount,
    getAccountSignInViewModel,
    dispatchAccountRecoveryAction,
  };
}

describe("useAccountActions", () => {
  afterEach(() => {
    cleanup();
    useAccountBootstrapStore.setState({
      projection: initialAccountBootstrapProjection(),
    });
  });

  beforeEach(() => {
    vi.stubEnv("VITE_SIP_USERNAME", "");
    vi.stubEnv("VITE_SIP_DOMAIN", "");
    vi.stubEnv("VITE_SIP_SERVER", "");
    vi.stubEnv("VITE_SIP_PASSWORD", "");
    useAccountBootstrapStore.setState({
      projection: {
        ...initialAccountBootstrapProjection(),
        hasActiveAccountSession: true,
      },
    });
  });

  it("loads saved profile options on mount", async () => {
    const { facade } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });
    expect(result.current.savedProfileOptions[0]?.label).toBe("1001");
  });

  it("keeps the password input visible for a saved profile", async () => {
    const { facade } = createFacadeMock({
      hasRememberedSipPassword: true,
    });
    const profileId = savedProfileFixture.id;
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(profileId);
    });

    expect(result.current.passwordFieldVisible).toBe(true);
  });

  it("signs in saved profile through signInAccount", async () => {
    const { facade, signInAccount } = createFacadeMock({
      hasRememberedSipPassword: true,
    });
    const profileId = savedProfileFixture.id;
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(profileId);
    });

    expect(result.current.passwordFieldVisible).toBe(true);

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(signInAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "sip_only",
          profile: { kind: "saved", profileId },
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.successKeys).toEqual([
        "account.success.sipTransportConnected",
        "account.success.sipRegistrationSucceeded",
      ]);
    });
  });

  it("surfaces registration failure without false SIP-ready success", async () => {
    const { facade, signInAccount } = createFacadeMock();
    signInAccount.mockResolvedValue(
      ok(
        createSipRegistrationFailedAccountSignInOutcome({
          detail: "Authentication Error",
          transportConnected: true,
        }),
      ),
    );
    const { result } = renderHook(() => useAccountActions({ facade }));

    act(() => {
      result.current.updateField("username", "1001");
      result.current.updateField("password", "secret");
      result.current.updateField("domain", "pbx.example.com");
      result.current.updateField("server", "wss://sip.example.com");
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.successKeys).toEqual([
        "account.success.sipTransportConnected",
      ]);
      expect(result.current.error).toEqual({ key: "account.error.invalidCredentials" });
      expect(result.current.openSystemStateAction).toBe(true);
    });
  });

  it("loads masked-form secrets and signs in without an overwrite prompt", async () => {
    const { facade, signInAccount } = createFacadeMock({
      sipPassword: "saved-sip-secret",
      ocpApiKey: "saved-ocp-secret",
    });
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });
    act(() => {
      result.current.selectProfile(savedProfileFixture.id);
    });
    await waitFor(() => {
      expect(result.current.form.password).toBe("saved-sip-secret");
      expect(result.current.ocpDraft.apiKey).toBe("saved-ocp-secret");
    });
    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(signInAccount).toHaveBeenCalledOnce();
    });
    expect(result.current.overwriteConfirmationOpen).toBe(false);
  });

  it("blocks submit when SIP is registered and exposes logout-first reason", async () => {
    const { facade, signInAccount, getAccountSignInViewModel } = createFacadeMock();
    getAccountSignInViewModel.mockResolvedValue(
      ok(
        createSignInViewModel({
          isSipRegistered: true,
          hasActiveAccountSession: true,
          loginDisabledReason: "account.signIn.disabled.logoutFirst",
        }),
      ),
    );

    const { result } = renderHook(() =>
      useAccountActions({
        facade,
        isSipRegistered: true,
        registeredIdentity: {
          username: "1001",
          domain: "pbx.example.com",
          server: "wss://sip.example.com",
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.loginDisabledReasonKey).toBe(
        "account.signIn.disabled.logoutFirst",
      );
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(signInAccount).not.toHaveBeenCalled();
  });

  it("re-enables Login after account session clears (avatar logout)", async () => {
    const { facade, getAccountSignInViewModel } = createFacadeMock();
    getAccountSignInViewModel.mockResolvedValue(
      ok(
        createSignInViewModel({
          hasActiveAccountSession: true,
          loginDisabledReason: "account.signIn.disabled.logoutFirst",
        }),
      ),
    );

    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.loginDisabledReasonKey).toBe(
        "account.signIn.disabled.logoutFirst",
      );
    });

    getAccountSignInViewModel.mockResolvedValue(
      ok(
        createSignInViewModel({
          hasActiveAccountSession: false,
          loginDisabledReason: null,
        }),
      ),
    );

    act(() => {
      useAccountBootstrapStore.setState({
        projection: {
          ...initialAccountBootstrapProjection(),
          hasActiveAccountSession: false,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.loginDisabledReasonKey).toBeNull();
    });
  });

  it("does not open switch confirmation when selecting another profile while registered", async () => {
    const { facade, signInAccount, listSavedAccountProfiles } = createFacadeMock();
    const otherProfile: SavedAccountProfile = {
      id: createSettingsAccountKey("1002@pbx.example.com"),
      username: "1002",
      domain: "pbx.example.com",
      server: "wss://sip.example.com",
      displayName: "1002",
      lifecycleStatus: "successful",
    };
    listSavedAccountProfiles.mockResolvedValue(ok([savedProfileFixture, otherProfile]));

    const { result } = renderHook(() =>
      useAccountActions({
        facade,
        isSipRegistered: true,
        registeredIdentity: {
          username: "1001",
          domain: "pbx.example.com",
          server: "wss://sip.example.com",
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(2);
    });

    act(() => {
      result.current.selectProfile(otherProfile.id);
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(signInAccount).not.toHaveBeenCalled();
    expect(result.current.loginDisabledReasonKey).toBe(
      "account.signIn.disabled.logoutFirst",
    );
  });

  it("builds OCP sign-in command with opted-in save before login", async () => {
    const { facade, signInAccount } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    act(() => {
      result.current.setSignInMode("ocp");
      result.current.setSaveProfileChecked(true);
      result.current.updateOcpField("login", "agent");
      result.current.updateOcpField("domain", "ocp.example");
      result.current.updateOcpField("apiKey", "proxy-key");
    });

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(signInAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "ocp",
          profile: { kind: "new_draft" },
          ocp: expect.objectContaining({
            login: "agent",
            domain: "ocp.example",
            apiKey: "proxy-key",
          }),
          save: expect.objectContaining({
            saveProfile: true,
            saveOcpApiKey: true,
          }),
        }),
      );
    });
  });

  it("dispatches state-specific recovery action", async () => {
    const { facade, dispatchAccountRecoveryAction, getAccountSignInViewModel } =
      createFacadeMock();
    getAccountSignInViewModel.mockResolvedValue(
      ok(
        createSignInViewModel({
          serverState: "failed",
          allowedRecoveryActions: ["retry_server"],
          primaryRecoveryAction: "retry_server",
        }),
      ),
    );

    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.allowedRecoveryActions).toContain("retry_server");
    });

    act(() => {
      result.current.handleRecoveryAction("retry_server");
    });

    await waitFor(() => {
      expect(dispatchAccountRecoveryAction).toHaveBeenCalledWith("retry_server");
    });
  });

  it("keeps password entry visible after authentication failure", async () => {
    const { facade, signInAccount } = createFacadeMock({
      hasRememberedSipPassword: true,
    });
    signInAccount.mockResolvedValue(
      err(
        createPlatformError(
          "operation_failed",
          "SIP registration failed for user: Authentication Error",
        ),
      ),
    );
    const profileId = savedProfileFixture.id;
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(profileId);
    });

    expect(result.current.passwordFieldVisible).toBe(true);

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.passwordFieldVisible).toBe(true);
    });
  });

  it("passes rememberPassword option via signInAccount for new SIP draft", async () => {
    const { facade, signInAccount } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    act(() => {
      result.current.setSaveProfileChecked(true);
      result.current.setRememberPasswordChecked(true);
      result.current.updateField("username", "1001");
      result.current.updateField("password", "secret");
      result.current.updateField("domain", "pbx.example.com");
      result.current.updateField("server", "wss://sip.example.com");
    });

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(signInAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "sip_only",
          profile: { kind: "new_draft" },
          sip: expect.objectContaining({
            username: "1001",
            password: "secret",
          }),
          save: expect.objectContaining({
            saveProfile: true,
            rememberPassword: true,
          }),
        }),
      );
    });
  });

  it("confirms a changed selected profile before overwriting its credentials", async () => {
    const { facade, signInAccount } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });
    act(() => {
      result.current.selectProfile(savedProfileFixture.id);
    });
    await waitFor(() => {
      expect(result.current.selectedProfileId).toBe(savedProfileFixture.id);
    });
    act(() => {
      result.current.updateField("password", "new-secret");
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.overwriteConfirmationOpen).toBe(true);
    expect(signInAccount).not.toHaveBeenCalled();

    act(() => {
      result.current.cancelOverwriteExistingCredentials();
    });
    expect(signInAccount).not.toHaveBeenCalled();

    act(() => {
      result.current.handleSubmit();
    });
    expect(result.current.overwriteConfirmationOpen).toBe(true);

    act(() => {
      result.current.continueWithoutOverwritingCredentials();
    });

    await waitFor(() => {
      expect(signInAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: { kind: "saved", profileId: savedProfileFixture.id },
        }),
      );
    });
  });

  it("signs in with overwrite after confirming the overwrite prompt (T-037)", async () => {
    const { facade, signInAccount } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });
    act(() => {
      result.current.selectProfile(savedProfileFixture.id);
    });
    await waitFor(() => {
      expect(result.current.selectedProfileId).toBe(savedProfileFixture.id);
    });
    act(() => {
      result.current.updateField("password", "new-secret");
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.overwriteConfirmationOpen).toBe(true);
    expect(signInAccount).not.toHaveBeenCalled();

    act(() => {
      result.current.confirmOverwriteExistingCredentials();
    });

    await waitFor(() => {
      expect(signInAccount).toHaveBeenCalledOnce();
    });
    expect(signInAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: { kind: "saved", profileId: savedProfileFixture.id },
        sip: expect.objectContaining({
          password: "new-secret",
        }),
        save: expect.objectContaining({
          saveProfile: true,
          rememberPassword: true,
        }),
      }),
    );
    await waitFor(() => {
      expect(result.current.overwriteConfirmationOpen).toBe(false);
    });
  });

  it("does not discard a dirty new-profile draft without confirmation", async () => {
    const { facade } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));
    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });
    act(() => {
      result.current.updateField("username", "draft-user");
    });
    act(() => {
      result.current.selectProfile(savedProfileFixture.id);
    });

    expect(result.current.draftDiscardConfirmationOpen).toBe(true);
    expect(result.current.selectedProfileId).toBeNull();

    act(() => {
      result.current.confirmDiscardDraftAndSelectProfile();
    });
    expect(result.current.selectedProfileId).toBe(savedProfileFixture.id);
  });

  it("clears ephemeral secrets when switching mode", () => {
    const { facade } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    act(() => {
      result.current.updateField("password", "sip-secret");
      result.current.updateOcpField("apiKey", "api-secret");
      result.current.setSignInMode("ocp");
    });

    expect(result.current.form.password).toBe("");
    expect(result.current.ocpDraft.apiKey).toBe("");
  });

  it("disables remember password until save profile is checked on New tab", () => {
    const { facade } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    expect(result.current.rememberPasswordDisabled).toBe(true);

    act(() => {
      result.current.setSaveProfileChecked(true);
    });

    expect(result.current.rememberPasswordDisabled).toBe(false);
  });
});

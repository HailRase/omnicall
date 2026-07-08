// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  createSettingsAccountKey,
  type SavedAccountProfile,
} from "@application/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { useAccountActions } from "./useAccountActions.js";

const savedProfileFixture: SavedAccountProfile = {
  id: createSettingsAccountKey("1001@pbx.example.com"),
  username: "1001",
  domain: "pbx.example.com",
  server: "wss://sip.example.com",
  displayName: "1001",
};

function createFacadeMock(
  options: Readonly<{ hasRememberedSipPassword?: boolean }> = {},
): {
  facade: AccountBootstrapFacade;
  authorizeManualAccount: ReturnType<typeof vi.fn>;
  authorizeSavedAccountProfile: ReturnType<typeof vi.fn>;
  listSavedAccountProfiles: ReturnType<typeof vi.fn>;
  hasRememberedSipPassword: ReturnType<typeof vi.fn>;
} {
  const authorizeSavedAccountProfile = vi.fn().mockResolvedValue(ok(undefined));
  const authorizeManualAccount = vi.fn().mockResolvedValue(ok(undefined));
  const listSavedAccountProfiles = vi.fn().mockResolvedValue(ok([savedProfileFixture]));
  const hasRememberedSipPassword = vi
    .fn()
    .mockResolvedValue(options.hasRememberedSipPassword ?? false);

  const facade = {
    listSavedAccountProfiles,
    authorizeManualAccount,
    authorizeSavedAccountProfile,
    deleteSavedAccountProfile: vi.fn().mockResolvedValue(ok(undefined)),
    hasRememberedSipPassword,
  } as unknown as AccountBootstrapFacade;

  return {
    facade,
    authorizeManualAccount,
    authorizeSavedAccountProfile,
    listSavedAccountProfiles,
    hasRememberedSipPassword,
  };
}

describe("useAccountActions", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SIP_USERNAME", "");
    vi.stubEnv("VITE_SIP_DOMAIN", "");
    vi.stubEnv("VITE_SIP_SERVER", "");
    vi.stubEnv("VITE_SIP_PASSWORD", "");
  });

  it("loads saved profile options on mount", async () => {
    const { facade } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });
    expect(result.current.savedProfileOptions[0]?.label).toBe("1001");
  });

  it("hides password prompt when saved profile has remembered password", async () => {
    const { facade, hasRememberedSipPassword } = createFacadeMock({
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

    await waitFor(() => {
      expect(hasRememberedSipPassword).toHaveBeenCalledWith(profileId);
    });

    await waitFor(() => {
      expect(result.current.passwordFieldVisible).toBe(false);
    });

    expect(result.current.rememberPasswordVisible).toBe(false);
    expect(result.current.passwordHintKey).toBeNull();
  });

  it("authorizes saved profile with remembered password via empty password submit", async () => {
    const { facade, authorizeSavedAccountProfile, hasRememberedSipPassword } = createFacadeMock({
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

    await waitFor(() => {
      expect(result.current.passwordFieldVisible).toBe(false);
    });

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(authorizeSavedAccountProfile).toHaveBeenCalledWith(profileId, "", {
        rememberPassword: false,
      });
    });
  });

  it("reveals password entry after remembered-password authorization fails", async () => {
    const { facade, authorizeSavedAccountProfile } = createFacadeMock({
      hasRememberedSipPassword: true,
    });
    authorizeSavedAccountProfile.mockResolvedValue(
      err(createPlatformError("operation_failed", "SIP registration failed")),
    );
    const profileId = savedProfileFixture.id;

    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(profileId);
    });

    await waitFor(() => {
      expect(result.current.passwordFieldVisible).toBe(false);
    });

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.passwordFieldVisible).toBe(true);
    });

    expect(result.current.rememberPasswordVisible).toBe(true);
    expect(result.current.selectedProfileId).toBe(profileId);
    expect(result.current.error).not.toBeNull();
  });

  it("resets forced password entry when switching to another saved profile", async () => {
    const otherProfile: SavedAccountProfile = {
      id: createSettingsAccountKey("1002@pbx.example.com"),
      username: "1002",
      domain: "pbx.example.com",
      server: "wss://sip.example.com",
      displayName: "1002",
    };
    const { facade, authorizeSavedAccountProfile, listSavedAccountProfiles } = createFacadeMock({
      hasRememberedSipPassword: true,
    });
    listSavedAccountProfiles.mockResolvedValue(ok([savedProfileFixture, otherProfile]));
    authorizeSavedAccountProfile.mockResolvedValue(
      err(createPlatformError("operation_failed", "SIP registration failed")),
    );

    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(2);
    });

    act(() => {
      result.current.selectProfile(savedProfileFixture.id);
    });

    await waitFor(() => {
      expect(result.current.passwordFieldVisible).toBe(false);
    });

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.passwordFieldVisible).toBe(true);
    });

    act(() => {
      result.current.selectProfile(otherProfile.id);
    });

    await waitFor(() => {
      expect(result.current.passwordFieldVisible).toBe(false);
    });
  });

  it("prefills form and clears password when selecting a saved profile", async () => {
    const { facade } = createFacadeMock();
    const profileId = savedProfileFixture.id;

    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(profileId);
    });

    expect(result.current.selectedProfileId).toBe(profileId);
    expect(result.current.form.password).toBe("");
    expect(result.current.form.username).toBe("1001");
    expect(result.current.passwordFieldVisible).toBe(true);
    expect(result.current.passwordHintKey).toBe("account.profile.passwordHint.savedProfile");
  });

  it("allows profile switch while registered when another saved profile is selected", async () => {
    const { facade } = createFacadeMock();
    const otherProfile: SavedAccountProfile = {
      id: createSettingsAccountKey("1002@pbx.example.com"),
      username: "1002",
      domain: "pbx.example.com",
      server: "wss://sip.example.com",
      displayName: "1002",
    };
    const listSavedAccountProfiles = vi
      .fn()
      .mockResolvedValue(ok([savedProfileFixture, otherProfile]));

    const facadeWithProfiles = {
      ...facade,
      listSavedAccountProfiles,
    } as unknown as AccountBootstrapFacade;

    const { result } = renderHook(() =>
      useAccountActions({
        facade: facadeWithProfiles,
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

    expect(result.current.profileSwitchAllowed).toBe(true);
  });

  it("resets to New when SIP registration ends", async () => {
    const { facade } = createFacadeMock();
    const { result, rerender } = renderHook(
      ({ isSipRegistered }) => useAccountActions({ facade, isSipRegistered }),
      { initialProps: { isSipRegistered: true } },
    );

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(result.current.savedProfileOptions[0]!.id);
    });

    rerender({ isSipRegistered: false });

    await waitFor(() => {
      expect(result.current.selectedProfileId).toBeNull();
    });
  });

  it("authorizes saved profile with password via facade", async () => {
    const { facade, authorizeSavedAccountProfile } = createFacadeMock();
    const profileId = savedProfileFixture.id;

    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(profileId);
    });

    act(() => {
      result.current.updateField("password", "secret");
    });

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(authorizeSavedAccountProfile).toHaveBeenCalledWith(profileId, "secret", {
        rememberPassword: false,
      });
    });
  });

  it("maps manual authorize registration failure to localized error key", async () => {
    const { facade, authorizeManualAccount } = createFacadeMock();
    authorizeManualAccount.mockResolvedValue(
      err(
        createPlatformError(
          "operation_failed",
          "SIP registration failed for user: Authentication Error",
        ),
      ),
    );

    const { result } = renderHook(() => useAccountActions({ facade }));

    act(() => {
      result.current.updateField("username", "1001");
      result.current.updateField("password", "wrong");
      result.current.updateField("domain", "pbx.example.com");
      result.current.updateField("server", "wss://sip.example.com");
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.error?.key).toBe("account.error.invalidCredentials");
    });
  });

  it("maps saved profile not found to profileNotFound error key", async () => {
    const { facade, authorizeSavedAccountProfile } = createFacadeMock();
    authorizeSavedAccountProfile.mockResolvedValue(
      err(createPlatformError("not_found", "Saved account profile was not found")),
    );
    const profileId = savedProfileFixture.id;

    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(profileId);
    });

    act(() => {
      result.current.updateField("password", "secret");
    });

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.error?.key).toBe("account.error.profileNotFound");
    });
  });

  it("opens switch confirmation when registered and submitting another profile", async () => {
    const { facade, authorizeSavedAccountProfile, listSavedAccountProfiles } = createFacadeMock();
    const otherProfile: SavedAccountProfile = {
      id: createSettingsAccountKey("1002@pbx.example.com"),
      username: "1002",
      domain: "pbx.example.com",
      server: "wss://sip.example.com",
      displayName: "1002",
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
      result.current.updateField("password", "secret");
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.switchConfirmationOpen).toBe(true);
    expect(result.current.switchFromLogin).toBe("1001");
    expect(result.current.switchToLogin).toBe("1002");
    expect(authorizeSavedAccountProfile).not.toHaveBeenCalled();

    act(() => {
      result.current.confirmSwitchProfile();
    });

    await waitFor(() => {
      expect(authorizeSavedAccountProfile).toHaveBeenCalledWith(otherProfile.id, "secret", {
        rememberPassword: false,
      });
    });
    expect(result.current.switchConfirmationOpen).toBe(false);
    expect(result.current.selectedProfileId).toBe(otherProfile.id);
  });

  it("disables remember password until save profile is checked on New tab", () => {
    const { facade } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    expect(result.current.rememberPasswordVisible).toBe(true);
    expect(result.current.rememberPasswordDisabled).toBe(true);
    expect(result.current.rememberPasswordDisabledReasonKey).toBe(
      "account.profile.rememberPassword.disabledRequiresSave",
    );

    act(() => {
      result.current.setSaveProfileChecked(true);
    });

    expect(result.current.rememberPasswordDisabled).toBe(false);
  });

  it("clears remember password when save profile is unchecked", () => {
    const { facade } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    act(() => {
      result.current.setSaveProfileChecked(true);
      result.current.setRememberPasswordChecked(true);
      result.current.setSaveProfileChecked(false);
    });

    expect(result.current.rememberPasswordChecked).toBe(false);
  });

  it("enables remember password for saved profile without remembered password", async () => {
    const { facade } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    await waitFor(() => {
      expect(result.current.savedProfileOptions).toHaveLength(1);
    });

    act(() => {
      result.current.selectProfile(savedProfileFixture.id);
    });

    expect(result.current.rememberPasswordVisible).toBe(true);
    expect(result.current.passwordFieldVisible).toBe(true);
    expect(result.current.rememberPasswordDisabled).toBe(false);
  });

  it("passes rememberPassword option to manual authorize", async () => {
    const { facade, authorizeManualAccount } = createFacadeMock();
    const { result } = renderHook(() => useAccountActions({ facade }));

    act(() => {
      result.current.setSaveProfileChecked(true);
    });

    act(() => {
      result.current.setRememberPasswordChecked(true);
    });

    act(() => {
      result.current.updateField("username", "1001");
      result.current.updateField("password", "secret");
      result.current.updateField("domain", "pbx.example.com");
      result.current.updateField("server", "wss://sip.example.com");
    });

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(authorizeManualAccount).toHaveBeenCalledWith(
        expect.objectContaining({ username: "1001", password: "secret" }),
        expect.objectContaining({ saveProfile: true, rememberPassword: true }),
      );
    });
  });
});

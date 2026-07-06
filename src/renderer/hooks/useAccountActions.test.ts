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

function createFacadeMock(): {
  facade: AccountBootstrapFacade;
  authorizeManualAccount: ReturnType<typeof vi.fn>;
  authorizeSavedAccountProfile: ReturnType<typeof vi.fn>;
  listSavedAccountProfiles: ReturnType<typeof vi.fn>;
} {
  const authorizeSavedAccountProfile = vi.fn().mockResolvedValue(ok(undefined));
  const authorizeManualAccount = vi.fn().mockResolvedValue(ok(undefined));
  const listSavedAccountProfiles = vi.fn().mockResolvedValue(ok([savedProfileFixture]));

  const facade = {
    listSavedAccountProfiles,
    authorizeManualAccount,
    authorizeSavedAccountProfile,
    deleteSavedAccountProfile: vi.fn().mockResolvedValue(ok(undefined)),
  } as unknown as AccountBootstrapFacade;

  return { facade, authorizeManualAccount, authorizeSavedAccountProfile, listSavedAccountProfiles };
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
      expect(authorizeSavedAccountProfile).toHaveBeenCalledWith(profileId, "secret");
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
      expect(authorizeSavedAccountProfile).toHaveBeenCalledWith(otherProfile.id, "secret");
    });
    expect(result.current.switchConfirmationOpen).toBe(false);
    expect(result.current.selectedProfileId).toBe(otherProfile.id);
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SoftphonePreloadApi } from "@shared/ipc/PreloadApi.js";
import { initialAccountBootstrapProjection } from "@application/projections/settings/accountBootstrapProjection.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { MockMediaGateway } from "@adapters/mock/MockMediaGateway.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { useSettingsActions } from "./useSettingsActions.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

function createFacade(settingsRepository: InMemorySettingsRepository): AccountBootstrapFacade {
  return new AccountBootstrapFacade({
    telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
    mediaGateway: new MockMediaGateway(),
    settingsRepository,
    logger: createTestLogger(),
  });
}

function createSoftphonePreloadApiMock(
  overrides: Partial<SoftphonePreloadApi> = {},
): SoftphonePreloadApi {
  return {
    getPlatformVersion: vi.fn().mockResolvedValue({
      version: "0.0.1",
      name: "Axatalk",
      platform: "win32",
    }),
    getProfilesStorageRoot: vi.fn().mockResolvedValue({ storageRoot: "/tmp/axatalk-profiles" }),
    invokeProfilesFilesystem: vi.fn().mockResolvedValue({ ok: true }),
    openExternalUrl: vi.fn().mockResolvedValue({ ok: true }),
    setNativeTheme: vi.fn().mockResolvedValue({ ok: true }),
    onBeforeClose: vi.fn().mockReturnValue(() => {}),
    acknowledgeShutdown: vi.fn().mockResolvedValue({ ok: true }),
    cancelShutdown: vi.fn().mockResolvedValue({ ok: true }),
    requestAppRestart: vi.fn().mockResolvedValue({ ok: true }),
    minimizeWindow: vi.fn().mockResolvedValue({ ok: true }),
    closeWindow: vi.fn().mockResolvedValue({ ok: true }),
    applyShellWindowLayout: vi.fn().mockResolvedValue(undefined),
    openContactsCsvImportDialog: vi.fn().mockResolvedValue({ ok: true, cancelled: true }),
    saveContactsCsvExportDialog: vi.fn().mockResolvedValue({ ok: true, cancelled: true }),
    ...overrides,
  };
}

describe("useSettingsActions", () => {
  const setNativeTheme = vi
    .fn<SoftphonePreloadApi["setNativeTheme"]>()
    .mockResolvedValue({ ok: true });

  beforeEach(() => {
    window.softphone = createSoftphonePreloadApiMock({ setNativeTheme });
  });

  afterEach(() => {
    vi.clearAllMocks();
    useAccountBootstrapStore.setState({
      projection: initialAccountBootstrapProjection(),
    });
  });

  it("applies settings on successful facade update", async () => {
    const applyMultiCallSettings = vi.fn();
    const facade = createFacade(new InMemorySettingsRepository());

    const { result } = renderHook(() =>
      useSettingsActions({
        facade,
        currentSettings: {
          multiSessionsEnabled: true,
          autoUnholdOnTransferFailure: true,
        },
        applyMultiCallSettings,
      }),
    );

    await act(async () => {
      result.current.onMultiSessionsToggle(false);
      await Promise.resolve();
    });

    expect(applyMultiCallSettings).toHaveBeenCalledWith({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
    expect(result.current.settingsUpdateError).toBeNull();
  });

  it("surfaces error when facade update fails", async () => {
    const applyMultiCallSettings = vi.fn();
    const settings = new InMemorySettingsRepository();
    vi.spyOn(settings, "saveUserSettings").mockRejectedValue(
      new Error("Repository unavailable"),
    );
    const facade = createFacade(settings);

    const { result } = renderHook(() =>
      useSettingsActions({
        facade,
        currentSettings: {
          multiSessionsEnabled: true,
          autoUnholdOnTransferFailure: true,
        },
        applyMultiCallSettings,
      }),
    );

    await act(async () => {
      result.current.onMultiSessionsToggle(false);
      await Promise.resolve();
    });

    expect(applyMultiCallSettings).not.toHaveBeenCalled();
    expect(result.current.settingsUpdateError).toBe("Repository unavailable");
  });

  it("loads persisted profile settings when SIP registration sync key appears", async () => {
    const applyMultiCallSettings = vi.fn();
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
    });
    const facade = createFacade(settings);

    await facade.authorizeManualAccount({
      username: "1001",
      password: "secret",
      domain: "pbx.example.com",
      server: "wss://sip.example.com",
    });

    const loaded = await facade.getUserSettingsForAccount();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    await facade.saveUserSettings({
      ...loaded.value,
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
    });

    useAccountBootstrapStore.setState({
      projection: initialAccountBootstrapProjection(),
    });

    const { result } = renderHook(() =>
      useSettingsActions({
        facade,
        currentSettings: {
          multiSessionsEnabled: true,
          autoUnholdOnTransferFailure: true,
        },
        applyMultiCallSettings,
      }),
    );

    expect(result.current.userSettings.language).toBe("ru");

    act(() => {
      useAccountBootstrapStore.setState({
        projection: {
          ...initialAccountBootstrapProjection(),
          authUiState: "sip_registered",
          phoneStatus: "online",
          sipUsername: "1001",
          sipDomain: "pbx.example.com",
        },
      });
    });

    await waitFor(() => {
      expect(result.current.userSettings.language).toBe("en");
      expect(result.current.userSettings.theme).toBe("dark");
    });

    expect(applyMultiCallSettings).toHaveBeenCalledWith({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
    expect(setNativeTheme).toHaveBeenCalledWith({ theme: "dark" });
  });
});

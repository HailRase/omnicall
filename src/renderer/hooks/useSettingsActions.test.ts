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
      name: "OmniCall",
      platform: "win32",
    }),
    getProfilesStorageRoot: vi.fn().mockResolvedValue({ storageRoot: "/tmp/omnicall-profiles" }),
    invokeProfilesFilesystem: vi.fn().mockResolvedValue({ ok: true }),
    invokeSecretStorage: vi.fn().mockResolvedValue({ ok: true }),
    openExternalUrl: vi.fn().mockResolvedValue({ ok: true }),
    openExternalApplicationWindow: vi.fn().mockResolvedValue({
      ok: true,
      focusedExisting: false,
    }),
    applyExternalApplicationCallEnded: vi.fn().mockResolvedValue({
      ok: true,
      affected: 0,
    }),
    setNativeTheme: vi.fn().mockResolvedValue({ ok: true }),
    onBeforeClose: vi.fn().mockReturnValue(() => {}),
    acknowledgeShutdown: vi.fn().mockResolvedValue({ ok: true }),
    cancelShutdown: vi.fn().mockResolvedValue({ ok: true }),
    requestAppRestart: vi.fn().mockResolvedValue({ ok: true }),
    minimizeWindow: vi.fn().mockResolvedValue({ ok: true }),
    closeWindow: vi.fn().mockResolvedValue({ ok: true }),
    toggleMaximizeWindow: vi.fn().mockResolvedValue({ ok: true }),
    getWindowMaximized: vi.fn().mockResolvedValue({ ok: true, maximized: false }),
    onWindowMaximizedChanged: vi.fn(() => () => undefined),
    setWindowAlwaysOnTop: vi.fn().mockResolvedValue({ ok: true, alwaysOnTop: false }),
    toggleWindowAlwaysOnTop: vi.fn().mockResolvedValue({ ok: true, alwaysOnTop: false }),
    getWindowAlwaysOnTop: vi.fn().mockResolvedValue({ ok: true, alwaysOnTop: false }),
    onWindowAlwaysOnTopChanged: vi.fn(() => () => undefined),
    applyShellWindowLayout: vi.fn().mockResolvedValue(undefined),
    raiseShellWindow: vi.fn().mockResolvedValue({ ok: true }),
    setShellTelephonyBusy: vi.fn().mockResolvedValue({ ok: true }),
    invokeSdkNativeWindow: vi.fn().mockResolvedValue({ ok: true, visible: true }),
    onShellOperatorAttention: vi.fn().mockReturnValue(() => {}),
    openContactsCsvImportDialog: vi.fn().mockResolvedValue({ ok: true, cancelled: true }),
    saveContactsCsvExportDialog: vi.fn().mockResolvedValue({ ok: true, cancelled: true }),
    openPreferencesImportDialog: vi.fn().mockResolvedValue({ ok: true, cancelled: true }),
    savePreferencesExportDialog: vi.fn().mockResolvedValue({ ok: true, cancelled: true }),
    setHeadsetPreferredDeviceId: vi.fn().mockResolvedValue({ ok: true }),
    listDisplaySources: vi.fn().mockResolvedValue({ ok: true, sources: [] }),
    setPendingDisplaySource: vi.fn().mockResolvedValue({ ok: true }),
    onSdkBrokerRequest: vi.fn().mockReturnValue(() => {}),
    replySdkBrokerRequest: vi.fn().mockResolvedValue({ ok: true }),
    publishSdkGatewayEvent: vi.fn().mockResolvedValue({ ok: true, delivered: 0 }),
    invokeSdkGatewaySettings: vi.fn().mockResolvedValue({
      ok: false,
      reason: "preload_unavailable",
    }),
    setSdkBrokerReady: vi.fn().mockResolvedValue({ ok: true }),
    onSdkClientSessionEnded: vi.fn().mockReturnValue(() => {}),
    executeExternalServiceHttp: vi.fn().mockResolvedValue({
      kind: "network_error",
      code: "unknown",
      durationMs: 0,
      message: "not implemented in test mock",
    }),
    openExternalServicesCollectionImportDialog: vi
      .fn()
      .mockResolvedValue({ ok: true, cancelled: true }),
    saveExternalServicesCollectionExportDialog: vi
      .fn()
      .mockResolvedValue({ ok: true, cancelled: true }),
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

  it("persists Notification Center master and quiet-successes preset", async () => {
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
      result.current.onMasterInAppPopupEnabledChange(false);
      await Promise.resolve();
    });

    expect(
      result.current.userSettings.notificationPreferences.masterInAppPopupEnabled,
    ).toBe(false);

    await act(async () => {
      result.current.onNotificationPreferencesPreset("quietSuccesses");
      await Promise.resolve();
    });

    expect(
      result.current.userSettings.notificationPreferences.modules.telephony.minLevel,
    ).toBe("warning");
    expect(
      result.current.userSettings.notificationPreferences.modules.contacts.minLevel,
    ).toBe("warning");

    await act(async () => {
      result.current.onNotificationModuleRaiseWindowChange("headset", "errors_only");
      await Promise.resolve();
    });

    expect(
      result.current.userSettings.notificationPreferences.modules.headset.raiseWindow,
    ).toBe("errors_only");
    expect(
      result.current.userSettings.notificationPreferences.modules.telephony.raiseWindow,
    ).toBe("never");
  });
});

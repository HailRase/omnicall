// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SoftphonePreloadApi } from "@shared/ipc/PreloadApi.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { MockMediaGateway } from "@adapters/mock/MockMediaGateway.js";
import { MockOperatorPlatformGateway } from "@adapters/mock/MockOperatorPlatformGateway.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { useSettingsActions } from "./useSettingsActions.js";

function createFacade(settingsRepository: InMemorySettingsRepository): AccountBootstrapFacade {
  return new AccountBootstrapFacade({
    operatorGateway: new MockOperatorPlatformGateway(),
    telephonyGateway: new MockTelephonyGateway("success"),
    mediaGateway: new MockMediaGateway(),
    settingsRepository,
    logger: createTestLogger(),
  });
}

describe("useSettingsActions", () => {
  const setNativeTheme = vi
    .fn<SoftphonePreloadApi["setNativeTheme"]>()
    .mockResolvedValue({ ok: true });

  beforeEach(() => {
    window.softphone = { setNativeTheme } as SoftphonePreloadApi;
  });

  afterEach(() => {
    vi.clearAllMocks();
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
});

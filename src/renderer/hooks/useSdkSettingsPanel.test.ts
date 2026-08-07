// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createDefaultUserSettings,
  createDefaultSdkOriginCapabilityMatrix,
} from "@application/index.js";
import { ok } from "@shared/result/index.js";
import type { NotificationDescriptor } from "./useNotifications.js";
import { useSdkSettingsPanel } from "./useSdkSettingsPanel.js";

describe("useSdkSettingsPanel", () => {
  it("bootstraps gateway policy without refreshing full UserSettings projection", async () => {
    const onActiveUserSettingsRefresh = vi.fn();
    const facade = {
      getUserSettingsForAccount: vi.fn(() =>
        Promise.resolve(ok(createDefaultUserSettings())),
      ),
      saveUserSettings: vi.fn((settings) => Promise.resolve(ok(settings))),
    };
    const invokeSdkGatewaySettings = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        snapshot: {
          diagnostics: {
            status: "listening" as const,
            bindHost: "127.0.0.1",
            bindPort: 17342,
            connectionCount: 0,
            authenticatedCount: 0,
            unauthenticatedCount: 0,
            pendingPairingCount: 0,
            pairedClientCount: 0,
            allowedOriginsCount: 0,
            lastErrorCode: null,
            windowHideAvailable: true as const,
          },
          origins: [],
          pendingOriginTrust: [],
          paired: [],
          pendingPairing: [],
        },
      }),
    );

    renderHook(() =>
      useSdkSettingsPanel({
        facade: facade as never,
        onActiveUserSettingsRefresh,
        invokeSdkGatewaySettings,
      }),
    );

    await waitFor(() => {
      expect(invokeSdkGatewaySettings).toHaveBeenCalledWith(
        expect.objectContaining({
          op: "applyPolicy",
        }),
      );
    });

    expect(onActiveUserSettingsRefresh).not.toHaveBeenCalled();
    expect(facade.saveUserSettings).not.toHaveBeenCalled();
  });

  it("mirror-save re-reads latest settings so concurrent language edits survive", async () => {
    const matrix = createDefaultSdkOriginCapabilityMatrix();
    const gatewayOrigin = {
      origin: "https://crm.example",
      state: "allowed" as const,
      matrix,
      previouslyAllowed: true,
      pairedClientIds: [] as const,
      updatedAtIso: "2026-08-07T00:00:00.000Z",
    };
    const persisted = createDefaultUserSettings();
    const withLanguageEn = {
      ...persisted,
      language: "en" as const,
    };
    const onActiveUserSettingsRefresh = vi.fn();
    const getUserSettingsForAccount = vi
      .fn()
      .mockResolvedValueOnce(ok(persisted))
      .mockResolvedValueOnce(ok(withLanguageEn));
    const saveUserSettings = vi.fn((settings) => Promise.resolve(ok(settings)));
    const facade = {
      getUserSettingsForAccount,
      saveUserSettings,
    };
    const invokeSdkGatewaySettings = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        snapshot: {
          diagnostics: {
            status: "listening" as const,
            bindHost: "127.0.0.1",
            bindPort: 17342,
            connectionCount: 0,
            authenticatedCount: 0,
            unauthenticatedCount: 0,
            pendingPairingCount: 0,
            pairedClientCount: 0,
            allowedOriginsCount: 1,
            lastErrorCode: null,
            windowHideAvailable: true as const,
          },
          origins: [gatewayOrigin],
          pendingOriginTrust: [],
          paired: [],
          pendingPairing: [],
        },
      }),
    );

    renderHook(() =>
      useSdkSettingsPanel({
        facade: facade as never,
        onActiveUserSettingsRefresh,
        invokeSdkGatewaySettings,
      }),
    );

    await waitFor(() => {
      expect(saveUserSettings).toHaveBeenCalled();
    });

    expect(saveUserSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "en",
        sdkIntegration: expect.objectContaining({
          originsManaged: true,
          origins: [gatewayOrigin],
        }),
      }),
    );
    expect(onActiveUserSettingsRefresh).toHaveBeenCalledTimes(1);
    expect(onActiveUserSettingsRefresh.mock.calls[0]?.[0].language).toBe("en");
  });

  it("does not re-bootstrap when notify identity changes", async () => {
    const onActiveUserSettingsRefresh = vi.fn();
    const facade = {
      getUserSettingsForAccount: vi.fn(() =>
        Promise.resolve(ok(createDefaultUserSettings())),
      ),
      saveUserSettings: vi.fn((settings) => Promise.resolve(ok(settings))),
    };
    const invokeSdkGatewaySettings = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        snapshot: {
          diagnostics: {
            status: "disabled" as const,
            bindHost: null,
            bindPort: null,
            connectionCount: 0,
            authenticatedCount: 0,
            unauthenticatedCount: 0,
            pendingPairingCount: 0,
            pairedClientCount: 0,
            allowedOriginsCount: 0,
            lastErrorCode: null,
            windowHideAvailable: true as const,
          },
          origins: [],
          pendingOriginTrust: [],
          paired: [],
          pendingPairing: [],
        },
      }),
    );

    const { rerender } = renderHook(
      (props: { notify: (descriptor: NotificationDescriptor) => string }) =>
        useSdkSettingsPanel({
          facade: facade as never,
          onActiveUserSettingsRefresh,
          invokeSdkGatewaySettings,
          notify: props.notify,
        }),
      {
        initialProps: {
          notify: () => "n-1",
        },
      },
    );

    await waitFor(() => {
      expect(facade.getUserSettingsForAccount).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      rerender({ notify: () => "n-2" });
      await Promise.resolve();
    });

    expect(facade.getUserSettingsForAccount).toHaveBeenCalledTimes(1);
    const gatewayCalls = invokeSdkGatewaySettings.mock.calls as ReadonlyArray<
      ReadonlyArray<Readonly<{ op?: string }>>
    >;
    const applyPolicyCalls = gatewayCalls.filter(
      (call) => call[0]?.op === "applyPolicy",
    );
    expect(applyPolicyCalls).toHaveLength(1);
  });
});

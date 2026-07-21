import { describe, expect, it, vi } from "vitest";
import {
  createDefaultUserSettings,
  SDK_INTEGRATION_DEFAULTS,
} from "@domain/index.js";
import { ok } from "@shared/result/index.js";
import { persistSdkIntegrationSettings } from "./persistSdkIntegrationSettings.js";

describe("persistSdkIntegrationSettings", () => {
  it("persists Origin trust policy and applies gateway policy without secrets", async () => {
    const current = createDefaultUserSettings();
    const next = {
      ...SDK_INTEGRATION_DEFAULTS,
      originsManaged: true,
    };
    const facade = {
      getUserSettingsForAccount: vi.fn(() => Promise.resolve(ok(current))),
      saveUserSettings: vi.fn((settings) => Promise.resolve(ok(settings))),
    };
    const invoke = vi.fn(() =>
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
            windowHideAvailable: false as const,
          },
          origins: [],
          pendingOriginTrust: [],
          paired: [],
          pendingPairing: [],
        },
      }),
    );
    const onRefresh = vi.fn();

    const result = await persistSdkIntegrationSettings({
      facade: facade as never,
      next,
      invoke,
      onRefresh,
    });

    expect(result.ok).toBe(true);
    expect(facade.saveUserSettings).toHaveBeenCalledWith({
      ...current,
      sdkIntegration: next,
    });
    expect(invoke).toHaveBeenCalledWith({
      op: "applyPolicy",
      policy: {
        originsManaged: true,
        origins: [],
      },
    });
    expect(JSON.stringify(invoke.mock.calls)).not.toMatch(/password|apiKey|token/i);
  });
});

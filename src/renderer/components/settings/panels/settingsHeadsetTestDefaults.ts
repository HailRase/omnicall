import { vi } from "vitest";
import { initialHeadsetConnectionProjection } from "@application/projections/headset/headsetConnectionProjection.js";

export const settingsHeadsetStoryDefaults = {
  headsetConnectionProjection: initialHeadsetConnectionProjection(),
  headsetEnabled: false,
  headsetAutoReconnect: true,
  onHeadsetEnabledChange: () => undefined,
  onHeadsetAutoReconnectChange: () => undefined,
  onConnectHeadset: () => undefined,
  onDisconnectHeadset: () => undefined,
} as const;

export const settingsHeadsetTestDefaults = {
  ...settingsHeadsetStoryDefaults,
  onHeadsetEnabledChange: vi.fn(),
  onHeadsetAutoReconnectChange: vi.fn(),
  onConnectHeadset: vi.fn(),
  onDisconnectHeadset: vi.fn(),
} as const;

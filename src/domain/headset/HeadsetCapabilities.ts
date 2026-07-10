/**
 * - Purpose: describe headset control capabilities for adapters and orchestrator.
 * - Inputs: vendor parser / gateway connection state.
 * - Outputs: feature flags plus mute input semantics (pulse vs latch).
 */
export type HeadsetMuteInputMode = "pulse" | "latch";

export type HeadsetCapabilities = Readonly<{
  supportsAnswer: boolean;
  supportsReject: boolean;
  supportsHangup: boolean;
  supportsHold: boolean;
  supportsMute: boolean;
  supportsOutgoingSignal: boolean;
  supportsIncomingSignal: boolean;
  supportsRejectOnHookOn: boolean;
  /** pulse = press/release (Jabra HSC016); latch = absolute mute bit (Poly BW3320). */
  muteInputMode: HeadsetMuteInputMode;
}>;

export function createDefaultHeadsetCapabilities(): HeadsetCapabilities {
  return {
    supportsAnswer: false,
    supportsReject: false,
    supportsHangup: false,
    supportsHold: false,
    supportsMute: false,
    supportsOutgoingSignal: false,
    supportsIncomingSignal: false,
    supportsRejectOnHookOn: false,
    muteInputMode: "pulse",
  };
}

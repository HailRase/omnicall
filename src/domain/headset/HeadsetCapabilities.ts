/**
 * - Purpose: describe headset control capabilities for adapters and orchestrator.
 * - Inputs: vendor parser / gateway connection state.
 * - Outputs: feature flags, mute input mode, mute/hold policy semantics.
 */
export type HeadsetMuteInputMode = "pulse" | "latch";

/** swallowAll = ignore firmware bounce in echo window (Poly); matchOnly = latch user override. */
export type HeadsetMuteEchoPolicy = "swallowAll" | "matchOnly";

export type HeadsetMuteSemantics = "absolute" | "toggle";

export type HeadsetHoldSemantics =
  | "hookOffResumesWhenHoldLed"
  | "dedicatedHoldButton";

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
  /** Firmware LED echo handling during sync window. */
  muteEchoPolicy: HeadsetMuteEchoPolicy;
  /** absolute = event.muted authoritative; toggle = invert focused mute. */
  muteSemantics: HeadsetMuteSemantics;
  /** hookOffResumesWhenHoldLed = Jabra/Poly default; dedicatedHoldButton = holdPressed only. */
  holdSemantics: HeadsetHoldSemantics;
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
    muteEchoPolicy: "matchOnly",
    muteSemantics: "absolute",
    holdSemantics: "hookOffResumesWhenHoldLed",
  };
}

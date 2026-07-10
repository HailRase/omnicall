import type { HeadsetCapabilities } from "@domain/index.js";
import type { HidReportParser } from "./hidTypes.js";

/**
 * - Purpose: map HidReportParser flags to domain HeadsetCapabilities.
 * - Inputs: HidReportParser (supportsHold, muteInputMode).
 * - Outputs: HeadsetCapabilities matching pre-profile adapter behavior.
 */
export function capabilitiesFromParser(parser: HidReportParser): HeadsetCapabilities {
  return {
    supportsAnswer: true,
    supportsReject: true,
    supportsHangup: true,
    supportsHold: parser.supportsHold,
    supportsMute: true,
    supportsOutgoingSignal: true,
    supportsIncomingSignal: true,
    supportsRejectOnHookOn: true,
    muteInputMode: parser.muteInputMode,
    muteSemantics: "absolute",
    holdSemantics: "hookOffResumesWhenHoldLed",
  };
}

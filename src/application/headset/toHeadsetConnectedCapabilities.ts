import type {
  HeadsetCapabilities,
  HeadsetConnectedCapabilities,
} from "@domain/index.js";

/**
 * - Purpose: map gateway HeadsetCapabilities to connect-event snapshot.
 * - Inputs: HeadsetCapabilities from HeadsetGateway.getCapabilities().
 * - Outputs: HeadsetConnectedCapabilities for domain event / projection.
 */
export function toHeadsetConnectedCapabilities(
  capabilities: HeadsetCapabilities,
): HeadsetConnectedCapabilities {
  return {
    supportsAnswer: capabilities.supportsAnswer,
    supportsReject: capabilities.supportsReject,
    supportsHangup: capabilities.supportsHangup,
    supportsHold: capabilities.supportsHold,
    supportsMute: capabilities.supportsMute,
    supportsRejectOnHookOn: capabilities.supportsRejectOnHookOn,
    muteInputMode: capabilities.muteInputMode,
  };
}

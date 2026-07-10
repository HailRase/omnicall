import type {
  HeadsetCapabilities,
  HeadsetHoldSemantics,
  HeadsetMuteInputMode,
  HeadsetMuteSemantics,
} from "@domain/index.js";
import type { HeadsetSyncQueue } from "../HeadsetSyncQueue.js";

/**
 * - Purpose: bundle orchestrator policy inputs for hardware event forwarding.
 * - Inputs: capabilities, mute/hold semantics, sync queue, echo guards.
 * - Outputs: readonly context consumed by forwardHeadsetHardwareEvent.
 */
export type HeadsetOrchestratorPolicyContext = Readonly<{
  capabilities: HeadsetCapabilities;
  muteSemantics: HeadsetMuteSemantics;
  holdSemantics: HeadsetHoldSemantics;
  muteInputMode: HeadsetMuteInputMode;
  queue: HeadsetSyncQueue;
  hookGuard: { suppressedUntil: number };
  acceptGuard: { suppressedUntil: number };
}>;

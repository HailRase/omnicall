import type { HeadsetCommand, HeadsetHardwareEvent } from "@domain/index.js";
import type { DomainEventPublisher, HeadsetGateway, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";
import {
  createHeadsetAnswerPressed,
  createHeadsetDisconnected,
  createHeadsetFaultOccurred,
  createHeadsetHangupPressed,
  createHeadsetHoldPressed,
  createHeadsetLedSyncRequested,
  createHeadsetMutePressed,
  type HeadsetFaultReason,
} from "@domain/headset/events/headsetEvents.js";
import type { HeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";
import { hasPendingOutgoingDial } from "./buildHeadsetCallSnapshot.js";
import {
  canToggleMuteFromHeadset,
  forwardHeadsetHardwareEvent,
  HOOK_ON_SUPPRESS_MS,
  type HeadsetHardwareCallbacks,
} from "./forwardHeadsetHardwareEvent.js";
import { HeadsetOrchestratorGuards } from "./HeadsetOrchestratorGuards.js";
import { HeadsetSyncQueue } from "./HeadsetSyncQueue.js";
import {
  resolveDeviceCommandsFromSnapshot,
  resolveInitialConnectCommands,
  resolveMuteRejectedLedCommands,
} from "./resolveDeviceCommandsFromSnapshot.js";
import { resolveHangupTargetId } from "./resolveHangupTargetId.js";

export type HeadsetSnapshotSource = () => HeadsetCallSnapshot;

export type HeadsetSessionOrchestratorDeps = Readonly<{
  gateway: HeadsetGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  getSnapshot: HeadsetSnapshotSource;
  callbacks: HeadsetHardwareCallbacks;
  onSyncBusyChanged?: () => void;
}>;

/**
 * - Purpose: bidirectional sync between telephony snapshot and headset gateway.
 * - Inputs: snapshot source, hardware callbacks, headset gateway.
 * - Outputs: LED commands and domain events for headset interactions.
 *
 * Critical: when device→app sync skips LED reconcile, lastSnapshot must stay
 * stale so a retry after intent clear can still emit presence/mute LED.
 */
export class HeadsetSessionOrchestrator {
  private started = false;
  private lastSnapshot: HeadsetCallSnapshot | null = null;
  private unsubscribeGateway: (() => void) | null = null;
  private readonly guards = new HeadsetOrchestratorGuards();
  private readonly queue = new HeadsetSyncQueue();
  private readonly hookGuard = { suppressedUntil: 0 };
  private readonly acceptGuard = { suppressedUntil: 0 };
  private ledFaultPublished = false;

  constructor(private readonly deps: HeadsetSessionOrchestratorDeps) {}

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.queue.setUiBusyClearListener(() => this.deps.onSyncBusyChanged?.());
    this.unsubscribeGateway = this.deps.gateway.subscribe((event) => {
      this.handleHardwareEvent(event);
    });
    this.lastSnapshot = this.deps.getSnapshot();
  }

  stop(): void {
    if (!this.started) {
      return;
    }
    this.started = false;
    this.queue.setUiBusyClearListener(null);
    this.unsubscribeGateway?.();
    this.unsubscribeGateway = null;
    this.lastSnapshot = null;
    this.ledFaultPublished = false;
  }

  onSnapshotChanged(next: HeadsetCallSnapshot): void {
    if (!this.started) {
      return;
    }

    // Outgoing dial owns headset focus — drop stale UI mute sync so held controls
    // cannot keep a stuck loader while mute is blocked for the dial window.
    const muteIntentSessionId = this.queue.getMuteIntentSessionId();
    if (
      hasPendingOutgoingDial(next) &&
      muteIntentSessionId !== null &&
      muteIntentSessionId !== next.focusSessionId
    ) {
      this.queue.abortMuteSync();
      this.deps.onSyncBusyChanged?.();
    }

    const applied = this.reconcileToDevice(this.lastSnapshot, next);
    if (applied) {
      this.lastSnapshot = next;
    }

    this.clearMatchedSyncGuards(next);

    // Device→app path may skip LED while intents are open. After intents clear,
    // retry so resume/hold/mute LED catch up against the still-stale lastSnapshot.
    if (!applied && !this.shouldSkipReconcile(next)) {
      if (this.reconcileToDevice(this.lastSnapshot, next)) {
        this.lastSnapshot = next;
      }
    }
  }

  onDeviceConnected(): void {
    if (!this.started) {
      return;
    }
    this.ledFaultPublished = false;
    const snapshot = this.deps.getSnapshot();
    this.enqueueCommands(resolveInitialConnectCommands(snapshot));
    this.lastSnapshot = snapshot;
  }

  getSyncQueue(): HeadsetSyncQueue {
    return this.queue;
  }

  private shouldSkipReconcile(next: HeadsetCallSnapshot): boolean {
    if (this.deps.gateway.getConnectedDevice() === null) {
      return true;
    }

    const commands = resolveDeviceCommandsFromSnapshot(this.lastSnapshot, next);
    const isIncomingSignalOnly =
      commands.length > 0 &&
      commands.every((command) => command.type === "signalIncoming");

    if (isIncomingSignalOnly) {
      return false;
    }

    // Skip only while device→app window is open AND a hold/mute intent is pending.
    // Use intent (not hold timer) so LED can catch up immediately after match.
    return (
      this.guards.isDeviceToAppGuardActive() && this.queue.hasPendingSyncIntent()
    );
  }

  private reconcileToDevice(
    previous: HeadsetCallSnapshot | null,
    next: HeadsetCallSnapshot,
  ): boolean {
    if (this.deps.gateway.getConnectedDevice() === null) {
      return false;
    }

    if (this.shouldSkipReconcile(next)) {
      return false;
    }

    const commands = resolveDeviceCommandsFromSnapshot(previous, next);
    if (commands.length === 0) {
      return true;
    }

    if (commands.some((command) => command.type === "setHoldIndicator")) {
      this.hookGuard.suppressedUntil = Date.now() + HOOK_ON_SUPPRESS_MS;
      // Clearing mute LED on hold often echoes muteChanged — do not toggle app mute.
      this.queue.armHardwareMuteEcho();
    }

    const restoringMuteAfterHold =
      previous !== null &&
      previous.focusedIsOnHold &&
      !next.focusedIsOnHold &&
      commands.some((command) => command.type === "setMute");
    if (restoringMuteAfterHold) {
      // Resume setMute LED must not toggle app mute via firmware echo.
      this.queue.armHardwareMuteEcho();
    }

    if (commands.some((command) => command.type === "setMute")) {
      const { muteEchoPolicy } = this.deps.gateway.getCapabilities();
      if (muteEchoPolicy === "swallowAll") {
        // Poly latch firmware often emits opposite mute bit while mute LED settles.
        this.queue.armHardwareMuteEcho();
      }
    }

    this.enqueueCommands(commands);
    return true;
  }

  private enqueueCommands(commands: ReadonlyArray<HeadsetCommand>): void {
    if (this.deps.gateway.getConnectedDevice() === null) {
      return;
    }
    this.queue.enqueue(async () => {
      this.guards.markAppToDeviceSync();
      for (const command of commands) {
        if (this.deps.gateway.getConnectedDevice() === null) {
          return;
        }
        const correlationId = createCorrelationId();
        this.deps.eventPublisher.publish(
          createHeadsetLedSyncRequested(correlationId, command.type),
        );
        const result = await this.deps.gateway.send(command);
        if (isErr(result)) {
          this.deps.logger.warn("headset_led_sync_failed", {
            correlationId,
            featureId: "F-012",
            boundedContext: "Headset",
            operation: "headset_led_sync",
            result: "failure",
            commandType: command.type,
            errorMessage: result.error.message,
          });
          if (
            !this.ledFaultPublished &&
            result.error.message === "headset_led_output_blocked"
          ) {
            this.ledFaultPublished = true;
            this.deps.eventPublisher.publish(
              createHeadsetFaultOccurred(correlationId, "led_blocked"),
            );
          }
          continue;
        }
      }
    });
  }

  private handleHardwareEvent(event: HeadsetHardwareEvent): void {
    if (event.type === "deviceError") {
      const correlationId = createCorrelationId();
      const reason = mapDeviceErrorToFaultReason(event.reason);
      this.deps.logger.warn("headset_device_error", {
        correlationId,
        featureId: "F-012",
        boundedContext: "Headset",
        operation: "headset_hardware_event",
        result: "failure",
        reason: event.reason,
      });
      this.deps.eventPublisher.publish(createHeadsetFaultOccurred(correlationId, reason));
      if (reason === "usb_disconnected") {
        this.deps.eventPublisher.publish(createHeadsetDisconnected(correlationId, null));
      }
      return;
    }

    const snapshot = this.deps.getSnapshot();
    const capabilities = this.deps.gateway.getCapabilities();

    // Incoming / outgoing dial: never toggle app mute; restore presence LED even if sync-locked.
    if (event.type === "muteChanged" && !canToggleMuteFromHeadset(snapshot)) {
      this.enqueueCommands(resolveMuteRejectedLedCommands(snapshot));
      return;
    }

    if (
      event.type === "muteChanged" &&
      this.queue.shouldIgnoreHardwareMuteEvent(
        event.muted,
        snapshot.focusedIsMuted,
        capabilities.muteInputMode,
        capabilities.muteEchoPolicy,
      )
    ) {
      return;
    }

    if (event.type === "holdPressed" && !capabilities.supportsHold) {
      return;
    }

    if (event.type === "holdPressed" && this.queue.isHardwareHoldLocked()) {
      return;
    }

    // Suppress hook-on echo while hold sync/LED settle; hangup remains allowed during mute sync.
    if (
      event.type === "hookOn" &&
      (this.queue.getHoldIntent() !== null || this.queue.isHoldSyncGuardActive())
    ) {
      return;
    }

    this.guards.markDeviceToAppSync();
    const incomingId = snapshot.firstIncomingCallId;
    const correlationId = createCorrelationId();
    this.publishHardwareDomainEvent(event, incomingId, snapshot, correlationId);
    forwardHeadsetHardwareEvent(event, snapshot, incomingId, this.deps.callbacks, {
      capabilities,
      muteSemantics: capabilities.muteSemantics,
      holdSemantics: capabilities.holdSemantics,
      muteInputMode: capabilities.muteInputMode,
      muteEchoPolicy: capabilities.muteEchoPolicy,
      hookGuard: this.hookGuard,
      acceptGuard: this.acceptGuard,
      queue: this.queue,
    });
    this.deps.onSyncBusyChanged?.();
  }

  private publishHardwareDomainEvent(
    event: HeadsetHardwareEvent,
    incomingId: string | undefined,
    snapshot: HeadsetCallSnapshot,
    correlationId: ReturnType<typeof createCorrelationId>,
  ): void {
    if (event.type === "hookOff" && incomingId !== undefined) {
      this.deps.eventPublisher.publish(
        createHeadsetAnswerPressed(correlationId, incomingId),
      );
      return;
    }
    if (event.type === "hookOn") {
      const callId = resolveHangupTargetId(snapshot) ?? incomingId;
      if (callId !== undefined) {
        this.deps.eventPublisher.publish(
          createHeadsetHangupPressed(correlationId, callId),
        );
      }
      return;
    }
    if (event.type === "holdPressed" && snapshot.focusSessionId !== undefined) {
      this.deps.eventPublisher.publish(
        createHeadsetHoldPressed(correlationId, snapshot.focusSessionId),
      );
      return;
    }
    if (
      event.type === "muteChanged" &&
      snapshot.focusSessionId !== undefined
    ) {
      this.deps.eventPublisher.publish(
        createHeadsetMutePressed(correlationId, snapshot.focusSessionId),
      );
    }
  }

  private clearMatchedSyncGuards(next: HeadsetCallSnapshot): void {
    if (next.focusSessionId !== undefined) {
      this.queue.clearHoldSyncIfMatched(next.focusSessionId, next.focusedIsOnHold);
    }

    // Match mute intent against the session that was muted (UI may mute held while
    // headset focus stays on outgoing dial).
    const muteSessionId = this.queue.getMuteIntentSessionId();
    if (muteSessionId !== null) {
      const mutedFromMap = next.mutedBySessionId[muteSessionId];
      const muted =
        mutedFromMap ??
        (next.focusSessionId === muteSessionId ? next.focusedIsMuted : undefined);
      if (muted !== undefined) {
        this.queue.clearMuteSyncIfMatched(muteSessionId, muted);
      }
    } else if (next.focusSessionId !== undefined) {
      this.queue.clearMuteSyncIfMatched(next.focusSessionId, next.focusedIsMuted);
    }

    this.deps.onSyncBusyChanged?.();
  }
}

export function createHeadsetHardwareCallbacks(deps: {
  answerCallById: (callId: string) => Promise<unknown>;
  rejectCallById: (callId: string) => Promise<unknown>;
  hangupCallById: (callId: string) => Promise<unknown>;
  toggleHoldCallById: (callId: string) => Promise<unknown>;
  muteCallById: (callId: string) => Promise<unknown>;
  unmuteCallById: (callId: string) => Promise<unknown>;
  isDnd?: () => boolean;
}): HeadsetHardwareCallbacks {
  return {
    onAnswer: (callId) => {
      if (callId === undefined) {
        return;
      }
      void deps.answerCallById(callId);
    },
    onReject: (callId) => {
      void deps.rejectCallById(callId);
    },
    onHangup: (callId) => {
      void deps.hangupCallById(callId);
    },
    onToggleHold: (callId) => {
      void deps.toggleHoldCallById(callId);
    },
    onSetMute: (callId, muted) => {
      if (muted) {
        void deps.muteCallById(callId);
      } else {
        void deps.unmuteCallById(callId);
      }
    },
    ...(deps.isDnd !== undefined ? { isDnd: deps.isDnd } : {}),
  };
}

function mapDeviceErrorToFaultReason(reason: string): HeadsetFaultReason {
  if (reason === "usb_disconnected") {
    return "usb_disconnected";
  }
  return "device_error";
}

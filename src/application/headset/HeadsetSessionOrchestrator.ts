import type { HeadsetCommand, HeadsetHardwareEvent } from "@domain/index.js";
import type { DomainEventPublisher, HeadsetGateway, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";
import {
  createHeadsetAnswerPressed,
  createHeadsetHangupPressed,
  createHeadsetHoldPressed,
  createHeadsetLedSyncRequested,
  createHeadsetMutePressed,
} from "@domain/headset/events/headsetEvents.js";
import type { HeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";
import {
  forwardHeadsetHardwareEvent,
  type HeadsetHardwareCallbacks,
} from "./forwardHeadsetHardwareEvent.js";
import { HeadsetOrchestratorGuards } from "./HeadsetOrchestratorGuards.js";
import { HeadsetSyncQueue } from "./HeadsetSyncQueue.js";
import {
  resolveDeviceCommandsFromSnapshot,
  resolveInitialConnectCommands,
} from "./resolveDeviceCommandsFromSnapshot.js";

export type HeadsetSnapshotSource = () => HeadsetCallSnapshot;

export type HeadsetSessionOrchestratorDeps = Readonly<{
  gateway: HeadsetGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  getSnapshot: HeadsetSnapshotSource;
  callbacks: HeadsetHardwareCallbacks;
}>;

/**
 * - Purpose: bidirectional sync between telephony snapshot and headset gateway.
 * - Inputs: snapshot source, hardware callbacks, headset gateway.
 * - Outputs: LED commands and domain events for headset interactions.
 */
export class HeadsetSessionOrchestrator {
  private started = false;
  private lastSnapshot: HeadsetCallSnapshot | null = null;
  private unsubscribeGateway: (() => void) | null = null;
  private readonly guards = new HeadsetOrchestratorGuards();
  private readonly queue = new HeadsetSyncQueue();
  private readonly hookGuard = { suppressedUntil: 0 };
  private readonly acceptGuard = { suppressedUntil: 0 };

  constructor(private readonly deps: HeadsetSessionOrchestratorDeps) {}

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.unsubscribeGateway = this.deps.gateway.subscribe((event) => {
      this.handleHardwareEvent(event);
    });
    const initial = this.deps.getSnapshot();
    this.reconcileToDevice(null, initial);
    this.lastSnapshot = initial;
  }

  stop(): void {
    if (!this.started) {
      return;
    }
    this.started = false;
    this.unsubscribeGateway?.();
    this.unsubscribeGateway = null;
    this.lastSnapshot = null;
  }

  onSnapshotChanged(next: HeadsetCallSnapshot): void {
    if (!this.started) {
      return;
    }
    const previous = this.lastSnapshot;
    this.reconcileToDevice(previous, next);
    this.lastSnapshot = next;
    this.clearMatchedSyncGuards(previous, next);
  }

  onDeviceConnected(): void {
    if (!this.started) {
      return;
    }
    const snapshot = this.deps.getSnapshot();
    const commands = resolveInitialConnectCommands(snapshot);
    this.enqueueCommands(commands);
    this.lastSnapshot = snapshot;
  }

  getSyncQueue(): HeadsetSyncQueue {
    return this.queue;
  }

  private reconcileToDevice(
    previous: HeadsetCallSnapshot | null,
    next: HeadsetCallSnapshot,
  ): void {
    if (this.guards.isDeviceToAppGuardActive()) {
      return;
    }
    const commands = resolveDeviceCommandsFromSnapshot(previous, next);
    if (commands.length === 0) {
      return;
    }
    this.guards.markAppToDeviceSync();
    this.enqueueCommands(commands);
  }

  private enqueueCommands(commands: ReadonlyArray<HeadsetCommand>): void {
    this.queue.enqueue(async () => {
      for (const command of commands) {
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
          });
        }
      }
    });
  }

  private handleHardwareEvent(event: HeadsetHardwareEvent): void {
    if (this.guards.isAppToDeviceGuardActive()) {
      return;
    }
    if (event.type === "deviceError") {
      this.deps.logger.warn("headset_device_error", {
        correlationId: createCorrelationId(),
        featureId: "F-012",
        boundedContext: "Headset",
        operation: "headset_hardware_event",
        result: "failure",
        reason: event.reason,
      });
      return;
    }
    if (this.queue.isHoldSyncGuardActive() && event.type !== "hookOff" && event.type !== "hookOn") {
      return;
    }
    this.guards.markDeviceToAppSync();
    const snapshot = this.deps.getSnapshot();
    const incomingId = snapshot.firstIncomingCallId;
    const correlationId = createCorrelationId();
    this.publishHardwareDomainEvent(event, incomingId, snapshot, correlationId);
    forwardHeadsetHardwareEvent(event, snapshot, incomingId, this.deps.callbacks, {
      hookGuard: this.hookGuard,
      acceptGuard: this.acceptGuard,
      queue: this.queue,
    });
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
      const callId = snapshot.activeSessionId ?? incomingId;
      if (callId !== undefined) {
        this.deps.eventPublisher.publish(
          createHeadsetHangupPressed(correlationId, callId),
        );
      }
      return;
    }
    if (event.type === "holdPressed" && snapshot.activeSessionId !== undefined) {
      this.deps.eventPublisher.publish(
        createHeadsetHoldPressed(correlationId, snapshot.activeSessionId),
      );
      return;
    }
    if (event.type === "mutePressed" && snapshot.activeSessionId !== undefined) {
      this.deps.eventPublisher.publish(
        createHeadsetMutePressed(correlationId, snapshot.activeSessionId),
      );
    }
  }

  private clearMatchedSyncGuards(
    previous: HeadsetCallSnapshot | null,
    next: HeadsetCallSnapshot,
  ): void {
    if (previous?.activeIsOnHold !== next.activeIsOnHold && next.activeSessionId !== undefined) {
      this.queue.clearHoldSyncIfMatched(next.activeSessionId);
    }
    if (previous?.activeIsMuted !== next.activeIsMuted && next.activeSessionId !== undefined) {
      this.queue.clearMuteSyncIfMatched(next.activeSessionId);
    }
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

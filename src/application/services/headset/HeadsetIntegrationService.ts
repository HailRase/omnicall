import type { UserSettings } from "@domain/index.js";
import {
  createHeadsetConnected,
  createHeadsetDisconnected,
} from "@domain/headset/events/headsetEvents.js";
import type { DomainEventPublisher, HeadsetGateway, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  buildHeadsetCallSnapshot,
  type HeadsetCallSnapshot,
} from "../../headset/buildHeadsetCallSnapshot.js";
import {
  createHeadsetHardwareCallbacks,
  HeadsetSessionOrchestrator,
} from "../../headset/HeadsetSessionOrchestrator.js";
import type { HeadsetSyncQueue } from "../../headset/HeadsetSyncQueue.js";
import type { IncomingCallProjection } from "../../projections/telephony/incomingCallProjection.js";
import type { MultiLineCallProjection } from "../../projections/telephony/multiLineCallProjection.js";
import {
  ConnectHeadsetDeviceUseCase,
  DisconnectHeadsetDeviceUseCase,
  TryHeadsetAutoReconnectUseCase,
} from "../../use-cases/headset/HeadsetConnectionUseCases.js";

export type HeadsetIntegrationCallbacks = Readonly<{
  answerCallById: (callId: string) => Promise<unknown>;
  rejectCallById: (callId: string) => Promise<unknown>;
  hangupCallById: (callId: string) => Promise<unknown>;
  toggleHoldCallById: (callId: string) => Promise<unknown>;
  muteCallById: (callId: string) => Promise<unknown>;
  unmuteCallById: (callId: string) => Promise<unknown>;
  isDnd?: () => boolean;
}>;

export type HeadsetIntegrationServiceDeps = Readonly<{
  gateway: HeadsetGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  callbacks: HeadsetIntegrationCallbacks;
  getMultiLineProjection: () => MultiLineCallProjection;
  getIncomingProjection: () => IncomingCallProjection;
}>;

/**
 * - Purpose: orchestrate optional headset integration lifecycle and telephony sync.
 * - Inputs: user settings, gateway connect/disconnect, call projections.
 * - Outputs: domain events, LED sync, hardware-driven Use Case calls.
 */
export class HeadsetIntegrationService {
  private orchestrator: HeadsetSessionOrchestrator | null = null;
  private enabled = false;

  private readonly connectUseCase: ConnectHeadsetDeviceUseCase;
  private readonly disconnectUseCase: DisconnectHeadsetDeviceUseCase;
  private readonly autoReconnectUseCase: TryHeadsetAutoReconnectUseCase;

  constructor(private readonly deps: HeadsetIntegrationServiceDeps) {
    this.connectUseCase = new ConnectHeadsetDeviceUseCase(deps.gateway, deps.logger);
    this.disconnectUseCase = new DisconnectHeadsetDeviceUseCase(deps.gateway, deps.logger);
    this.autoReconnectUseCase = new TryHeadsetAutoReconnectUseCase(deps.gateway, deps.logger);
  }

  getGateway(): HeadsetGateway {
    return this.deps.gateway;
  }

  getSyncQueue(): HeadsetSyncQueue | null {
    return this.orchestrator?.getSyncQueue() ?? null;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async applySettings(settings: UserSettings): Promise<void> {
    const shouldEnable = settings.headsetEnabled;
    if (shouldEnable === this.enabled) {
      if (shouldEnable && this.orchestrator === null) {
        this.startOrchestrator();
      }
      if (shouldEnable && settings.headsetAutoReconnect) {
        await this.tryAutoReconnect();
      }
      return;
    }

    if (!shouldEnable) {
      await this.disable();
      return;
    }

    this.enabled = true;
    this.startOrchestrator();
    if (settings.headsetAutoReconnect) {
      await this.tryAutoReconnect();
    }
  }

  async connectDevice(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const correlationId = createCorrelationId();
    const result = await this.connectUseCase.execute({ correlationId });
    if (!result.ok) {
      this.deps.logger.warn("headset_connect_failed", {
        correlationId,
        featureId: "F-012",
        boundedContext: "Headset",
        operation: "connect_headset",
        result: "failure",
      });
      return;
    }
    this.deps.eventPublisher.publish(
      createHeadsetConnected(correlationId, result.value.id, result.value.productName),
    );
    this.orchestrator?.onDeviceConnected();
  }

  async disconnectDevice(): Promise<void> {
    const correlationId = createCorrelationId();
    const device = this.deps.gateway.getConnectedDevice();
    await this.disconnectUseCase.execute({ correlationId });
    this.deps.eventPublisher.publish(
      createHeadsetDisconnected(correlationId, device?.id ?? null),
    );
  }

  async tryAutoReconnect(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const correlationId = createCorrelationId();
    const result = await this.autoReconnectUseCase.execute({ correlationId });
    if (!result.ok) {
      return;
    }
    if (result.value === null) {
      return;
    }
    this.deps.eventPublisher.publish(
      createHeadsetConnected(correlationId, result.value.id, result.value.productName),
    );
    this.orchestrator?.onDeviceConnected();
  }

  onCallProjectionsChanged(): void {
    if (!this.enabled || this.orchestrator === null) {
      return;
    }
    this.orchestrator.onSnapshotChanged(this.buildSnapshot());
  }

  private async disable(): Promise<void> {
    this.enabled = false;
    this.stopOrchestrator();
    await this.disconnectDevice();
  }

  private startOrchestrator(): void {
    if (this.orchestrator !== null) {
      return;
    }
    this.orchestrator = new HeadsetSessionOrchestrator({
      gateway: this.deps.gateway,
      eventPublisher: this.deps.eventPublisher,
      logger: this.deps.logger,
      getSnapshot: () => this.buildSnapshot(),
      callbacks: createHeadsetHardwareCallbacks(this.deps.callbacks),
    });
    this.orchestrator.start();
  }

  private stopOrchestrator(): void {
    this.orchestrator?.stop();
    this.orchestrator = null;
  }

  private buildSnapshot(): HeadsetCallSnapshot {
    return buildHeadsetCallSnapshot(
      this.deps.getMultiLineProjection(),
      this.deps.getIncomingProjection(),
    );
  }
}

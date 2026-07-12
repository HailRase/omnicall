import type { UserSettings } from "@domain/index.js";
import {
  createHeadsetConnected,
  createHeadsetDisconnected,
  createHeadsetFaultOccurred,
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
import { toHeadsetConnectedCapabilities } from "../../headset/toHeadsetConnectedCapabilities.js";
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
 * - Inputs: user settings, gateway connect/disconnect, call projections, operator selection.
 * - Outputs: domain events, LED sync, hardware-driven Use Case calls.
 */
export class HeadsetIntegrationService {
  private orchestrator: HeadsetSessionOrchestrator | null = null;
  private enabled = false;
  private preferredDeviceId: string | null = null;
  private operatorSelectedCallId: string | null = null;
  private onSyncBusyChanged: (() => void) | null = null;
  private onPreferredDeviceChanged: ((deviceId: string) => void) | null = null;

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

  setSyncBusyListener(listener: (() => void) | null): void {
    this.onSyncBusyChanged = listener;
  }

  setPreferredDeviceChangedListener(listener: ((deviceId: string) => void) | null): void {
    this.onPreferredDeviceChanged = listener;
  }

  beginUiHoldSync(sessionId: string, intent: "hold" | "resume"): boolean {
    if (!this.enabled) {
      return true;
    }
    const queue = this.orchestrator?.getSyncQueue();
    if (queue === undefined) {
      return true;
    }
    const started = queue.beginHoldSessionSync(sessionId, intent);
    if (started) {
      this.onSyncBusyChanged?.();
    }
    return started;
  }

  beginUiMuteSync(sessionId: string, muted: boolean): boolean {
    if (!this.enabled) {
      return true;
    }
    const queue = this.orchestrator?.getSyncQueue();
    if (queue === undefined) {
      return true;
    }
    const started = queue.beginMuteSessionSync(sessionId, muted);
    if (started) {
      this.onSyncBusyChanged?.();
    }
    return started;
  }

  abortUiHoldSync(sessionId: string): void {
    this.orchestrator?.getSyncQueue().abortHoldSync(sessionId);
    this.onSyncBusyChanged?.();
  }

  abortUiMuteSync(sessionId: string): void {
    this.orchestrator?.getSyncQueue().abortMuteSync(sessionId);
    this.onSyncBusyChanged?.();
  }

  /**
   * - Purpose: clear UI mute sync after a successful mute/unmute Use Case.
   * - Inputs: session id and resulting muted flag.
   * - Outputs: matched sync clear + busy listener refresh.
   */
  confirmUiMuteSync(sessionId: string, muted: boolean): void {
    const queue = this.orchestrator?.getSyncQueue();
    if (queue === undefined) {
      return;
    }
    queue.clearMuteSyncIfMatched(sessionId, muted);
    this.onSyncBusyChanged?.();
  }

  isSyncBusy(): boolean {
    return this.orchestrator?.getSyncQueue().hasPendingSyncIntent() ?? false;
  }

  setSelectedCallId(callId: string | null): void {
    if (this.operatorSelectedCallId === callId) {
      return;
    }
    this.operatorSelectedCallId = callId;
    this.onCallProjectionsChanged();
  }

  getSelectedCallId(): string | null {
    return this.operatorSelectedCallId;
  }

  async applySettings(settings: UserSettings): Promise<void> {
    this.preferredDeviceId = settings.headsetPreferredDeviceId;
    this.deps.gateway.setPreferredDeviceId(settings.headsetPreferredDeviceId);
    this.deps.gateway.setAutoReconnectEnabled(settings.headsetAutoReconnect);
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

  async connectDevice(deviceId: string | null = null): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const correlationId = createCorrelationId();
    const result =
      deviceId === null
        ? await this.connectUseCase.execute({ correlationId })
        : await this.deps.gateway.connectGrantedDevice(deviceId);
    if (!result.ok) {
      this.deps.logger.warn("headset_connect_failed", {
        correlationId,
        featureId: "F-012",
        boundedContext: "Headset",
        operation: "connect_headset",
        result: "failure",
      });
      const faultReason =
        result.error.message === "headset_hid_unsupported"
          ? "unsupported"
          : "connect_failed";
      this.deps.eventPublisher.publish(
        createHeadsetFaultOccurred(correlationId, faultReason),
      );
      return;
    }
    this.rememberPreferredDevice(result.value.id);
    this.deps.eventPublisher.publish(
      createHeadsetConnected(
        correlationId,
        result.value.id,
        result.value.productName,
        toHeadsetConnectedCapabilities(this.deps.gateway.getCapabilities()),
      ),
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
    const result = await this.autoReconnectUseCase.execute({
      correlationId,
      preferredDeviceId: this.preferredDeviceId,
    });
    if (!result.ok) {
      return;
    }
    if (result.value === null) {
      return;
    }
    this.rememberPreferredDevice(result.value.id);
    this.deps.eventPublisher.publish(
      createHeadsetConnected(
        correlationId,
        result.value.id,
        result.value.productName,
        toHeadsetConnectedCapabilities(this.deps.gateway.getCapabilities()),
      ),
    );
    this.orchestrator?.onDeviceConnected();
  }

  async listGrantedDevices(): Promise<
    ReadonlyArray<Readonly<{ id: string; productName: string }>>
  > {
    return this.deps.gateway.listGrantedDevices();
  }

  private rememberPreferredDevice(deviceId: string): void {
    if (this.preferredDeviceId === deviceId) {
      return;
    }
    this.preferredDeviceId = deviceId;
    this.deps.gateway.setPreferredDeviceId(deviceId);
    this.onPreferredDeviceChanged?.(deviceId);
  }

  onCallProjectionsChanged(): void {
    if (!this.enabled || this.orchestrator === null) {
      return;
    }
    this.pruneStaleSelection();
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
      onSyncBusyChanged: () => this.onSyncBusyChanged?.(),
    });
    this.orchestrator.start();
  }

  private stopOrchestrator(): void {
    this.orchestrator?.stop();
    this.orchestrator = null;
  }

  private pruneStaleSelection(): void {
    if (this.operatorSelectedCallId === null) {
      return;
    }
    const selected = this.operatorSelectedCallId;
    const multiLine = this.deps.getMultiLineProjection();
    const incoming = this.deps.getIncomingProjection();
    const lineAlive = multiLine.lines.some(
      (line) =>
        line.callId === selected &&
        (line.state === "Active" ||
          line.state === "Held" ||
          line.state === "Connecting" ||
          line.state === "Ringing"),
    );
    const incomingAlive =
      incoming.visible &&
      incoming.callId === selected &&
      (incoming.uiState === "incomingRinging" ||
        incoming.uiState === "callerIdentityLoading" ||
        incoming.uiState === "callerIdentityResolved" ||
        incoming.uiState === "autoAnswerCountdown" ||
        incoming.uiState === "rejectReasonRequired");
    if (!lineAlive && !incomingAlive) {
      this.operatorSelectedCallId = null;
    }
  }

  private buildSnapshot(): HeadsetCallSnapshot {
    return buildHeadsetCallSnapshot(
      this.deps.getMultiLineProjection(),
      this.deps.getIncomingProjection(),
      {
        selectedCallId: this.operatorSelectedCallId ?? undefined,
      },
    );
  }
}

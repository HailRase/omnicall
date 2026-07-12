import type {
  DomainEventPublisher,
  HostIntegrationGateway,
  Logger,
  MediaGateway,
  SettingsRepository,
  TelephonyGateway,
} from "@ports/index.js";
import { CallVideoMediaProjection } from "../../projections/media/CallVideoMediaProjection.js";
import type { Call, CallId, CallVideoMediaState } from "@domain/index.js";
import {
  createCallRemoteHeldEvent,
  createCallRemoteResumedEvent,
  createCallDowngradedToAudioOnlyEvent,
  createCallMediaModeSelectedEvent,
  createCameraAvailabilityChangedEvent,
  createIncomingRemoteVideoOfferedChangedEvent,
  createRemoteVideoPresenceChangedEvent,
} from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { isErr } from "@shared/result/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ActiveCallControlService } from "./ActiveCallControlService.js";
import { CallTracker } from "./CallTracker.js";
import { MultiCallPolicyService } from "./MultiCallPolicyService.js";
import type {
  AnswerCallInput,
  HandleCallAnsweredInput,
  HandleCallFailedInput,
  HandleCallProgressInput,
  HandleIncomingCallInput,
  HangupCallInput,
  HoldCallInput,
  MakeCallInput,
  MuteCallInput,
  RejectCallInput,
  ResumeCallInput,
  SendDtmfInput,
  UnmuteCallInput,
  BlindTransferInput,
  StartConsultationInput,
  AttendedTransferInput,
  StartTransferModeInput,
  CancelTransferInput,
} from "./callEngineTypes.js";
import { DtmfOrchestrator } from "./DtmfOrchestrator.js";
import { IncomingCallOrchestrator } from "./IncomingCallOrchestrator.js";
import { OutgoingCallOrchestrator } from "./OutgoingCallOrchestrator.js";
import { TransferCallControlService } from "./TransferCallControlService.js";
import type { TransferCallControlDeps } from "./transferCallControlTypes.js";
import { publishConsultationLegAbortion } from "./attendedTransferRollback.js";
import { executeTransferCleanupOnCallEnded } from "./transferCleanupOnCallEnded.js";

export type {
  AnswerCallInput,
  HandleCallAnsweredInput,
  HandleCallFailedInput,
  HandleCallProgressInput,
  HandleIncomingCallInput,
  HangupCallInput,
  HoldCallInput,
  MakeCallInput,
  MuteCallInput,
  RejectCallInput,
  ResumeCallInput,
  SendDtmfInput,
  UnmuteCallInput,
  BlindTransferInput,
  StartConsultationInput,
  AttendedTransferInput,
  StartTransferModeInput,
  CancelTransferInput,
} from "./callEngineTypes.js";

/**
 * - Purpose: orchestrate telephony call lifecycle through specialized services.
 * - Inputs: gateway ports, settings, events, logger, optional host integration.
 * - Outputs: delegated call operations and state progression via domain events.
 */
export class CallEngine {
  private readonly callTracker = new CallTracker();
  private readonly videoMediaProjection = new CallVideoMediaProjection();
  private readonly outboundRemoteAudioOnlyCandidates = new Set<CallId>();
  private readonly activeCallControlService: ActiveCallControlService;
  private readonly multiCallPolicyService: MultiCallPolicyService;
  private readonly outgoingCallOrchestrator: OutgoingCallOrchestrator;
  private readonly incomingCallOrchestrator: IncomingCallOrchestrator;
  private readonly dtmfOrchestrator: DtmfOrchestrator;
  private readonly transferCallControlDeps: TransferCallControlDeps;
  private readonly transferCallControlService: TransferCallControlService;
  private readonly eventPublisher: DomainEventPublisher;
  private readonly logger: Logger;

  constructor(
    telephonyGateway: TelephonyGateway,
    mediaGateway: MediaGateway,
    settingsRepository: SettingsRepository,
    eventPublisher: DomainEventPublisher,
    logger: Logger,
    hostIntegrationGateway?: HostIntegrationGateway,
  ) {
    this.eventPublisher = eventPublisher;
    this.logger = logger;
    const sharedDeps = {
      telephonyGateway,
      mediaGateway,
      eventPublisher,
      logger,
      callTracker: this.callTracker,
      videoMediaProjection: this.videoMediaProjection,
    };

    this.activeCallControlService = new ActiveCallControlService({
      telephonyGateway,
      mediaGateway,
      eventPublisher,
      logger,
      resolveTrackedCall: (callId) => this.callTracker.getTrackedCall(callId),
      trackCall: (call) => this.callTracker.trackCall(call),
      clearIncomingCallById: (callId) => this.callTracker.clearIncomingCallById(callId),
    });
    this.multiCallPolicyService = new MultiCallPolicyService({
      settingsRepository,
      eventPublisher,
      logger,
      callTracker: this.callTracker,
      mediaGateway,
      holdCall: (input) => this.activeCallControlService.holdCall(input),
      resumeCall: (input) => this.activeCallControlService.resumeCall(input),
    });
    this.activeCallControlService.setExclusiveHoldEnforcer((targetCallId, correlationId) =>
      this.multiCallPolicyService.enforceExclusiveHoldBeforeResume(
        targetCallId,
        correlationId,
      ),
    );
    this.outgoingCallOrchestrator = new OutgoingCallOrchestrator({
      ...sharedDeps,
      settingsRepository,
      multiCallPolicyService: this.multiCallPolicyService,
    });
    this.incomingCallOrchestrator = new IncomingCallOrchestrator({
      ...sharedDeps,
      settingsRepository,
      multiCallPolicyService: this.multiCallPolicyService,
      ...(hostIntegrationGateway !== undefined
        ? { hostIntegrationGateway }
        : {}),
    });
    this.dtmfOrchestrator = new DtmfOrchestrator({
      telephonyGateway,
      eventPublisher,
      logger,
    });
    this.transferCallControlDeps = {
      telephonyGateway,
      mediaGateway,
      settingsRepository,
      eventPublisher,
      logger,
      resolveTrackedCall: (callId) => this.callTracker.getTrackedCall(callId),
      trackCall: (call) => this.callTracker.trackCall(call),
      clearIncomingCallById: (callId) => this.callTracker.clearIncomingCallById(callId),
      getTransferSession: () => this.callTracker.getTransferSession(),
      setTransferSession: (session) => this.callTracker.setTransferSession(session),
      getTransferModeSourceCallId: () => this.callTracker.getTransferModeSourceCallId(),
      setTransferModeSourceCallId: (callId) =>
        this.callTracker.setTransferModeSourceCallId(callId),
      makeCall: (input) => this.outgoingCallOrchestrator.makeCall(input),
      hangupCall: (input) => this.activeCallControlService.hangupCall(input),
      resumeCall: (input) => this.activeCallControlService.resumeCall(input),
    };
    this.transferCallControlService = new TransferCallControlService(
      this.transferCallControlDeps,
    );
  }

  makeCall(
    input: MakeCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.outgoingCallOrchestrator.makeCall(input);
  }

  getCallVideoMediaState(callId: CallId): CallVideoMediaState | null {
    return this.videoMediaProjection.getByCallId(callId);
  }

  getVideoMediaProjection(): CallVideoMediaProjection {
    return this.videoMediaProjection;
  }

  handleCameraAvailability(
    callId: CallId,
    available: boolean,
    correlationId?: CorrelationId,
  ): void {
    const next = this.videoMediaProjection.setCameraAvailableState(callId, available);
    if (next === null) {
      return;
    }

    const resolvedCorrelationId = correlationId ?? createCorrelationId();
    this.eventPublisher.publish(
      createCameraAvailabilityChangedEvent(
        resolvedCorrelationId,
        callId,
        available,
      ),
    );
    this.logger.info("call_camera_availability_changed", {
      correlationId: resolvedCorrelationId,
      featureId: "F-027",
      boundedContext: "Media",
      operation: "handle_camera_availability",
      callId,
      result: "succeeded",
      available,
    });
  }

  handleRemoteVideoPresence(
    callId: CallId,
    present: boolean,
    correlationId?: CorrelationId,
  ): void {
    this.applyRemoteVideoPresence(callId, present, correlationId, true);
  }

  handleRemoteVideoPresenceFromMedia(
    callId: CallId,
    present: boolean,
    correlationId?: CorrelationId,
  ): void {
    this.applyRemoteVideoPresence(callId, present, correlationId, false);
  }

  private applyRemoteVideoPresence(
    callId: CallId,
    present: boolean,
    correlationId: CorrelationId | undefined,
    allowOutboundDowngrade: boolean,
  ): void {
    const before = this.videoMediaProjection.getByCallId(callId);
    const next = this.videoMediaProjection.setRemoteVideoPresent(callId, present);
    if (next === null) {
      return;
    }

    const resolvedCorrelationId = correlationId ?? createCorrelationId();
    this.eventPublisher.publish(
      createRemoteVideoPresenceChangedEvent(
        resolvedCorrelationId,
        callId,
        present,
      ),
    );
    this.logger.info("call_remote_video_presence_changed", {
      correlationId: resolvedCorrelationId,
      featureId: "F-027",
      boundedContext: "Media",
      operation: "remote_video_presence",
      callId,
      result: "succeeded",
      present,
    });

    if (!allowOutboundDowngrade) {
      return;
    }

    if (!present && before?.mediaMode === "video") {
      const tracked = this.callTracker.getTrackedCall(callId);
      if (!isErr(tracked) && tracked.value.direction === "outgoing") {
        this.outboundRemoteAudioOnlyCandidates.add(callId);
        if (tracked.value.state === "Active") {
          this.downgradeCallToAudioOnly(callId, resolvedCorrelationId, "remote_audio_only");
        }
      }
    } else if (present) {
      this.outboundRemoteAudioOnlyCandidates.delete(callId);
    }
  }

  private tryDowngradeDeferredOutboundVideoToAudio(
    callId: CallId,
    correlationId: CorrelationId,
  ): void {
    if (!this.outboundRemoteAudioOnlyCandidates.has(callId)) {
      return;
    }

    const tracked = this.callTracker.getTrackedCall(callId);
    if (isErr(tracked) || tracked.value.direction !== "outgoing") {
      return;
    }
    if (tracked.value.state !== "Active") {
      return;
    }

    this.downgradeCallToAudioOnly(callId, correlationId, "remote_audio_only");
  }

  private downgradeCallToAudioOnly(
    callId: CallId,
    correlationId: CorrelationId,
    reason: "remote_audio_only",
  ): void {
    const current = this.videoMediaProjection.getByCallId(callId);
    if (current === null || current.mediaMode === "audio") {
      this.outboundRemoteAudioOnlyCandidates.delete(callId);
      return;
    }

    this.videoMediaProjection.selectMediaMode(callId, "audio");
    this.eventPublisher.publish(
      createCallMediaModeSelectedEvent(correlationId, callId, "audio"),
    );
    this.eventPublisher.publish(
      createCallDowngradedToAudioOnlyEvent(correlationId, callId, reason),
    );
    this.outboundRemoteAudioOnlyCandidates.delete(callId);
    this.logger.info("call_downgraded_to_audio_only", {
      correlationId,
      featureId: "F-027",
      boundedContext: "Media",
      operation: "downgrade_to_audio_only",
      callId,
      result: "succeeded",
      reason,
    });
  }

  handleIncomingRemoteVideoOffered(
    callId: CallId,
    offered: boolean,
    correlationId?: CorrelationId,
  ): void {
    const resolvedCorrelationId = correlationId ?? createCorrelationId();
    this.eventPublisher.publish(
      createIncomingRemoteVideoOfferedChangedEvent(
        resolvedCorrelationId,
        callId,
        offered,
      ),
    );
    this.logger.info("call_incoming_remote_video_offered_changed", {
      correlationId: resolvedCorrelationId,
      featureId: "F-027",
      boundedContext: "Media",
      operation: "incoming_remote_video_offered",
      callId,
      result: "succeeded",
      offered,
    });
  }

  handleProgress(
    input: HandleCallProgressInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.outgoingCallOrchestrator.handleProgress(input);
  }

  handleAnswered(
    input: HandleCallAnsweredInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.outgoingCallOrchestrator.handleAnswered(input);
  }

  handleFailed(
    input: HandleCallFailedInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    publishConsultationLegAbortion(
      this.transferCallControlDeps,
      correlationId,
      input.call.id,
      input.failure,
    );
    return this.outgoingCallOrchestrator.handleFailed(input);
  }

  handleIncomingReceived(
    input: HandleIncomingCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.incomingCallOrchestrator.handleIncomingReceived(input);
  }

  refreshAutoAnswerSchedules(): Promise<void> {
    return this.incomingCallOrchestrator.refreshAutoAnswerSchedules();
  }

  answerCall(
    input: AnswerCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.incomingCallOrchestrator.answerCall(input);
  }

  rejectCall(
    input: RejectCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.incomingCallOrchestrator.rejectCall(input);
  }

  async handleCallEnded(callId: CallId, correlationId?: CorrelationId): Promise<void> {
    const resolvedCorrelationId = correlationId ?? createCorrelationId();
    publishConsultationLegAbortion(
      this.transferCallControlDeps,
      resolvedCorrelationId,
      callId,
      "call_ended",
    );
    await executeTransferCleanupOnCallEnded(
      this.transferCallControlDeps,
      callId,
      resolvedCorrelationId,
    );
    await this.incomingCallOrchestrator.handleCallEnded(callId, resolvedCorrelationId);
    this.videoMediaProjection.remove(callId);
    this.outboundRemoteAudioOnlyCandidates.delete(callId);
  }

  handleRemoteHold(callId: CallId, correlationId?: CorrelationId): void {
    const resolvedCorrelationId = correlationId ?? createCorrelationId();
    const trackedResult = this.callTracker.getTrackedCall(callId);
    if (!trackedResult.ok) {
      return;
    }

    this.eventPublisher.publish(
      createCallRemoteHeldEvent(resolvedCorrelationId, { callId }),
    );
    this.logger.info("call_remote_hold_received", {
      correlationId: resolvedCorrelationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "remote_hold",
      callId,
      previousState: trackedResult.value.state,
      nextState: trackedResult.value.state,
      result: "succeeded",
    });
  }

  async handleRemoteResume(callId: CallId, correlationId?: CorrelationId): Promise<void> {
    const resolvedCorrelationId = correlationId ?? createCorrelationId();
    const trackedResult = this.callTracker.getTrackedCall(callId);
    if (!trackedResult.ok) {
      return;
    }

    this.eventPublisher.publish(
      createCallRemoteResumedEvent(resolvedCorrelationId, { callId }),
    );
    this.logger.info("call_remote_resume_received", {
      correlationId: resolvedCorrelationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "remote_resume",
      callId,
      previousState: trackedResult.value.state,
      nextState: trackedResult.value.state,
      result: "succeeded",
    });

    await this.activeCallControlService.reapplyMutedMediaStateIfNeeded(
      callId,
      resolvedCorrelationId,
    );
  }

  async handleOutboundCallAnswered(
    callId: CallId,
    correlationId?: CorrelationId,
  ): Promise<void> {
    const trackedResult = this.callTracker.getTrackedCall(callId);
    if (!trackedResult.ok) {
      return;
    }

    const tracked = trackedResult.value;
    const wasActive = tracked.state === "Active";

    if (!wasActive) {
      await this.outgoingCallOrchestrator.handleAnswered({
        call: tracked,
        ...(correlationId !== undefined ? { correlationId } : {}),
      });
    }

    const resolvedCorrelationId = correlationId ?? createCorrelationId();
    this.tryDowngradeDeferredOutboundVideoToAudio(callId, resolvedCorrelationId);

    this.transferCallControlService.completeConsultationWhenAnswered(
      callId,
      resolvedCorrelationId,
    );
  }

  async handlePeerConnectionAvailable(
    callId: CallId,
    correlationId?: CorrelationId,
  ): Promise<void> {
    const trackedResult = this.callTracker.getTrackedCall(callId);
    if (!trackedResult.ok) {
      return;
    }

    const tracked = trackedResult.value;
    if (tracked.state !== "Active") {
      return;
    }

    const input = {
      call: tracked,
      ...(correlationId !== undefined ? { correlationId } : {}),
    };
    const resolvedCorrelationId = correlationId ?? createCorrelationId();

    await this.activeCallControlService.reapplyMutedMediaStateIfNeeded(
      callId,
      resolvedCorrelationId,
    );

    if (tracked.direction === "outgoing") {
      await this.outgoingCallOrchestrator.retryRemoteAudioAttach(input);
      this.tryDowngradeDeferredOutboundVideoToAudio(callId, resolvedCorrelationId);
      return;
    }

    await this.incomingCallOrchestrator.retryRemoteAudioAttach(input);
  }

  hangupCall(
    input: HangupCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.activeCallControlService.hangupCall(input);
  }

  holdCall(
    input: HoldCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.activeCallControlService.holdCall(input);
  }

  resumeCall(
    input: ResumeCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.activeCallControlService.resumeCall(input);
  }

  muteCall(
    input: MuteCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.activeCallControlService.muteCall(input);
  }

  unmuteCall(
    input: UnmuteCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.activeCallControlService.unmuteCall(input);
  }

  sendDtmf(
    input: SendDtmfInput,
  ): Promise<Result<void, ReturnType<typeof createPlatformError>>> {
    return this.dtmfOrchestrator.sendDtmf(input);
  }

  blindTransfer(
    input: BlindTransferInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.transferCallControlService.blindTransfer(input);
  }

  startConsultation(
    input: StartConsultationInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.transferCallControlService.startConsultation(input);
  }

  attendedTransfer(
    input: AttendedTransferInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.transferCallControlService.attendedTransfer(input);
  }

  startTransferMode(
    input: StartTransferModeInput,
  ): Result<void, ReturnType<typeof createPlatformError>> {
    return this.transferCallControlService.startTransferMode(input);
  }

  cancelTransfer(
    input: CancelTransferInput,
  ): Promise<Result<void, ReturnType<typeof createPlatformError>>> {
    return this.transferCallControlService.cancelTransfer(input);
  }

  async hangupAllCalls(correlationId: CorrelationId): Promise<void> {
    const callIds = new Set<CallId>();

    for (const call of this.callTracker.getAllTrackedCalls()) {
      if (call.state !== "Ended" && call.state !== "Failed") {
        callIds.add(call.id);
      }
    }

    const incomingCall = this.callTracker.getActiveIncomingCall();
    if (
      incomingCall !== null &&
      incomingCall.state !== "Ended" &&
      incomingCall.state !== "Failed"
    ) {
      callIds.add(incomingCall.id);
    }

    for (const callId of callIds) {
      await this.hangupCall({ callId, correlationId });
    }
  }
}

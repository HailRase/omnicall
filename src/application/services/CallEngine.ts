import type {
  DomainEventPublisher,
  HostIntegrationGateway,
  Logger,
  MediaGateway,
  SettingsRepository,
  TelephonyGateway,
} from "@ports/index.js";
import type { Call, CallId } from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
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
  private readonly activeCallControlService: ActiveCallControlService;
  private readonly multiCallPolicyService: MultiCallPolicyService;
  private readonly outgoingCallOrchestrator: OutgoingCallOrchestrator;
  private readonly incomingCallOrchestrator: IncomingCallOrchestrator;
  private readonly dtmfOrchestrator: DtmfOrchestrator;
  private readonly transferCallControlDeps: TransferCallControlDeps;
  private readonly transferCallControlService: TransferCallControlService;

  constructor(
    telephonyGateway: TelephonyGateway,
    mediaGateway: MediaGateway,
    settingsRepository: SettingsRepository,
    eventPublisher: DomainEventPublisher,
    logger: Logger,
    hostIntegrationGateway?: HostIntegrationGateway,
  ) {
    const sharedDeps = {
      telephonyGateway,
      mediaGateway,
      eventPublisher,
      logger,
      callTracker: this.callTracker,
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
    return this.outgoingCallOrchestrator.handleFailed(input);
  }

  handleIncomingReceived(
    input: HandleIncomingCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.incomingCallOrchestrator.handleIncomingReceived(input);
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
    await executeTransferCleanupOnCallEnded(
      this.transferCallControlDeps,
      callId,
      resolvedCorrelationId,
    );
    await this.incomingCallOrchestrator.handleCallEnded(callId, resolvedCorrelationId);
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

    this.transferCallControlService.completeConsultationWhenAnswered(
      callId,
      correlationId ?? createCorrelationId(),
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

    if (tracked.direction === "outgoing") {
      await this.outgoingCallOrchestrator.retryRemoteAudioAttach(input);
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

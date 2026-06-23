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
} from "./callEngineTypes.js";
import { DtmfOrchestrator } from "./DtmfOrchestrator.js";
import { IncomingCallOrchestrator } from "./IncomingCallOrchestrator.js";
import { OutgoingCallOrchestrator } from "./OutgoingCallOrchestrator.js";
import { TransferCallControlService } from "./TransferCallControlService.js";

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
      holdCall: (input) => this.activeCallControlService.holdCall(input),
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
    this.transferCallControlService = new TransferCallControlService({
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
      makeCall: (input) => this.outgoingCallOrchestrator.makeCall(input),
      hangupCall: (input) => this.activeCallControlService.hangupCall(input),
    });
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

  handleCallEnded(callId: CallId, correlationId?: CorrelationId): Promise<void> {
    return this.incomingCallOrchestrator.handleCallEnded(callId, correlationId);
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
}

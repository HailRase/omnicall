import type {
  AnswerCallCommand,
  AttendedTransferCommand,
  BlindTransferCommand,
  HangupCommand,
  HoldCallCommand,
  MakeCallCommand,
  RejectCallCommand,
  RegisterAccountCommand,
  ResumeCallCommand,
  SendDtmfCommand,
  TelephonyCallEndedNotification,
  TelephonyIncomingCallNotification,
  TelephonyGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type MockTelephonyScenario = "success" | "failure";
export type MockMakeCallScenario =
  | "connecting"
  | "progress_180"
  | "progress_183"
  | "answered"
  | "failed_busy"
  | "failed_rejected"
  | "failed_unavailable";
export type MockDtmfScenario = "success" | "failure";
export type MockIncomingAnswerScenario = "success" | "failure";
export type MockIncomingRejectScenario = "success" | "failure";
export type MockHoldScenario = "success" | "failure";
export type MockResumeScenario = "success" | "failure";
export type MockHangupScenario = "success" | "failure";
export type MockBlindTransferScenario = "success" | "failure";
export type MockAttendedTransferScenario = "success" | "failure";

export type MockTelephonyGatewayOptions = Readonly<{
  registrationScenario?: MockTelephonyScenario;
  makeCallScenario?: MockMakeCallScenario;
  dtmfScenario?: MockDtmfScenario;
  incomingAnswerScenario?: MockIncomingAnswerScenario;
  incomingRejectScenario?: MockIncomingRejectScenario;
  holdScenario?: MockHoldScenario;
  resumeScenario?: MockResumeScenario;
  hangupScenario?: MockHangupScenario;
  blindTransferScenario?: MockBlindTransferScenario;
  attendedTransferScenario?: MockAttendedTransferScenario;
  delayMs?: number;
}>;

export class MockTelephonyGateway implements TelephonyGateway {
  private registrationScenario: MockTelephonyScenario;
  private makeCallScenario: MockMakeCallScenario;
  private dtmfScenario: MockDtmfScenario;
  private incomingAnswerScenario: MockIncomingAnswerScenario;
  private incomingRejectScenario: MockIncomingRejectScenario;
  private holdScenario: MockHoldScenario;
  private resumeScenario: MockResumeScenario;
  private hangupScenario: MockHangupScenario;
  private blindTransferScenario: MockBlindTransferScenario;
  private attendedTransferScenario: MockAttendedTransferScenario;
  private readonly delayMs: number;
  private registered = false;
  private readonly dialedNumbers: string[] = [];
  private readonly sentTones: string[] = [];
  private readonly hangupCalls: string[] = [];
  private readonly answeredCalls: string[] = [];
  private readonly heldCalls: string[] = [];
  private readonly resumedCalls: string[] = [];
  private readonly blindTransferCalls: Array<{
    callId: string;
    targetNumber: string;
  }> = [];
  private readonly attendedTransferCalls: Array<{
    sourceCallId: string;
    consultationCallId: string;
  }> = [];
  private readonly rejectedCalls: Array<{
    callId: string;
    sipCode?: number;
    reason?: string;
  }> = [];
  private incomingCallHandler:
    | ((notification: TelephonyIncomingCallNotification) => Promise<void>)
    | null = null;
  private callEndedHandler:
    | ((notification: TelephonyCallEndedNotification) => Promise<void>)
    | null = null;

  constructor(options: MockTelephonyGatewayOptions);
  constructor(scenario?: MockTelephonyScenario, delayMs?: number);
  constructor(
    scenarioOrOptions: MockTelephonyScenario | MockTelephonyGatewayOptions = "success",
    delayMs = 0,
  ) {
    if (typeof scenarioOrOptions === "string") {
      this.registrationScenario = scenarioOrOptions;
      this.makeCallScenario = "answered";
      this.dtmfScenario = "success";
      this.incomingAnswerScenario = "success";
      this.incomingRejectScenario = "success";
      this.holdScenario = "success";
      this.resumeScenario = "success";
      this.hangupScenario = "success";
      this.blindTransferScenario = "success";
      this.attendedTransferScenario = "success";
      this.delayMs = delayMs;
      return;
    }

    this.registrationScenario = scenarioOrOptions.registrationScenario ?? "success";
    this.makeCallScenario = scenarioOrOptions.makeCallScenario ?? "answered";
    this.dtmfScenario = scenarioOrOptions.dtmfScenario ?? "success";
    this.incomingAnswerScenario =
      scenarioOrOptions.incomingAnswerScenario ?? "success";
    this.incomingRejectScenario =
      scenarioOrOptions.incomingRejectScenario ?? "success";
    this.holdScenario = scenarioOrOptions.holdScenario ?? "success";
    this.resumeScenario = scenarioOrOptions.resumeScenario ?? "success";
    this.hangupScenario = scenarioOrOptions.hangupScenario ?? "success";
    this.blindTransferScenario = scenarioOrOptions.blindTransferScenario ?? "success";
    this.attendedTransferScenario =
      scenarioOrOptions.attendedTransferScenario ?? "success";
    this.delayMs = scenarioOrOptions.delayMs ?? 0;
  }

  setScenario(scenario: MockTelephonyScenario): void {
    this.registrationScenario = scenario;
  }

  setMakeCallScenario(scenario: MockMakeCallScenario): void {
    this.makeCallScenario = scenario;
  }

  setDtmfScenario(scenario: MockDtmfScenario): void {
    this.dtmfScenario = scenario;
  }

  setIncomingAnswerScenario(scenario: MockIncomingAnswerScenario): void {
    this.incomingAnswerScenario = scenario;
  }

  setIncomingRejectScenario(scenario: MockIncomingRejectScenario): void {
    this.incomingRejectScenario = scenario;
  }

  setHoldScenario(scenario: MockHoldScenario): void {
    this.holdScenario = scenario;
  }

  setResumeScenario(scenario: MockResumeScenario): void {
    this.resumeScenario = scenario;
  }

  setHangupScenario(scenario: MockHangupScenario): void {
    this.hangupScenario = scenario;
  }

  setBlindTransferScenario(scenario: MockBlindTransferScenario): void {
    this.blindTransferScenario = scenario;
  }

  setAttendedTransferScenario(scenario: MockAttendedTransferScenario): void {
    this.attendedTransferScenario = scenario;
  }

  isRegistered(): boolean {
    return this.registered;
  }

  getDialedNumbers(): ReadonlyArray<string> {
    return this.dialedNumbers;
  }

  getSentTones(): ReadonlyArray<string> {
    return this.sentTones;
  }

  getHangupCalls(): ReadonlyArray<string> {
    return this.hangupCalls;
  }

  getAnsweredCalls(): ReadonlyArray<string> {
    return this.answeredCalls;
  }

  getHeldCalls(): ReadonlyArray<string> {
    return this.heldCalls;
  }

  getResumedCalls(): ReadonlyArray<string> {
    return this.resumedCalls;
  }

  getBlindTransferCalls(): ReadonlyArray<{
    callId: string;
    targetNumber: string;
  }> {
    return this.blindTransferCalls;
  }

  getAttendedTransferCalls(): ReadonlyArray<{
    sourceCallId: string;
    consultationCallId: string;
  }> {
    return this.attendedTransferCalls;
  }

  getRejectedCalls(): ReadonlyArray<{
    callId: string;
    sipCode?: number;
    reason?: string;
  }> {
    return this.rejectedCalls;
  }

  async register(
    command: RegisterAccountCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    if (this.registrationScenario === "failure") {
      return err(
        createPlatformError(
          "operation_failed",
          `SIP registration failed for ${command.account.username}`,
        ),
      );
    }

    this.registered = true;
    return ok(undefined);
  }

  unregister(correlationId: CorrelationId): Promise<Result<void, PlatformError>> {
    void correlationId;
    this.registered = false;
    return Promise.resolve(ok(undefined));
  }

  async makeCall(command: MakeCallCommand): Promise<Result<{
    stage: "connecting";
  } | {
    stage: "progress";
    progressCode: number;
  } | {
    stage: "answered";
  }, PlatformError>> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    this.dialedNumbers.push(command.number);

    if (this.makeCallScenario === "failed_busy") {
      return err(
        createPlatformError("operation_failed", `busy: ${command.number}`),
      );
    }

    if (this.makeCallScenario === "failed_rejected") {
      return err(
        createPlatformError(
          "operation_failed",
          `rejected: ${command.number}`,
        ),
      );
    }

    if (this.makeCallScenario === "failed_unavailable") {
      return err(
        createPlatformError(
          "operation_failed",
          `unavailable: ${command.number}`,
        ),
      );
    }

    if (this.makeCallScenario === "connecting") {
      return ok({ stage: "connecting" });
    }

    if (this.makeCallScenario === "progress_180") {
      return ok({ stage: "progress", progressCode: 180 });
    }

    if (this.makeCallScenario === "progress_183") {
      return ok({ stage: "progress", progressCode: 183 });
    }

    return ok({ stage: "answered" });
  }

  async sendDtmf(command: SendDtmfCommand): Promise<Result<void, PlatformError>> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    if (this.dtmfScenario === "failure") {
      return err(
        createPlatformError(
          "operation_failed",
          `DTMF send failed for tone ${command.tone}`,
        ),
      );
    }

    this.sentTones.push(command.tone);
    return ok(undefined);
  }

  async answerCall(command: AnswerCallCommand): Promise<Result<void, PlatformError>> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }
    if (this.incomingAnswerScenario === "failure") {
      return err(
        createPlatformError("operation_failed", `Answer failed for ${command.callId}`),
      );
    }
    this.answeredCalls.push(command.callId);
    return ok(undefined);
  }

  async rejectCall(command: RejectCallCommand): Promise<Result<void, PlatformError>> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }
    if (this.incomingRejectScenario === "failure") {
      return err(
        createPlatformError("operation_failed", `Reject failed for ${command.callId}`),
      );
    }
    const rejectedCall: {
      callId: string;
      sipCode?: number;
      reason?: string;
    } = {
      callId: command.callId,
    };
    if (command.sipCode !== undefined) {
      rejectedCall.sipCode = command.sipCode;
    }
    if (command.reason !== undefined) {
      rejectedCall.reason = command.reason;
    }
    this.rejectedCalls.push(rejectedCall);
    return ok(undefined);
  }

  hangup(command: HangupCommand): Promise<Result<void, PlatformError>> {
    if (this.hangupScenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Hangup failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.hangupCalls.push(command.callId);
    return Promise.resolve(ok(undefined));
  }

  holdCall(command: HoldCallCommand): Promise<Result<void, PlatformError>> {
    if (this.holdScenario === "failure") {
      return Promise.resolve(
        err(createPlatformError("operation_failed", `Hold failed for ${command.callId}`)),
      );
    }

    this.heldCalls.push(command.callId);
    return Promise.resolve(ok(undefined));
  }

  resumeCall(command: ResumeCallCommand): Promise<Result<void, PlatformError>> {
    if (this.resumeScenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Resume failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.resumedCalls.push(command.callId);
    return Promise.resolve(ok(undefined));
  }

  blindTransfer(command: BlindTransferCommand): Promise<Result<void, PlatformError>> {
    if (this.blindTransferScenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Blind transfer failed for ${command.callId} to ${command.targetNumber}`,
          ),
        ),
      );
    }

    this.blindTransferCalls.push({
      callId: command.callId,
      targetNumber: command.targetNumber,
    });
    return Promise.resolve(ok(undefined));
  }

  attendedTransfer(
    command: AttendedTransferCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.attendedTransferScenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Attended transfer failed for ${command.sourceCallId} via ${command.consultationCallId}`,
          ),
        ),
      );
    }

    this.attendedTransferCalls.push({
      sourceCallId: command.sourceCallId,
      consultationCallId: command.consultationCallId,
    });
    return Promise.resolve(ok(undefined));
  }

  setIncomingCallHandler(
    handler: ((notification: TelephonyIncomingCallNotification) => Promise<void>) | null,
  ): () => void {
    this.incomingCallHandler = handler;
    return () => {
      this.incomingCallHandler = null;
    };
  }

  setCallEndedHandler(
    handler: ((notification: TelephonyCallEndedNotification) => Promise<void>) | null,
  ): () => void {
    this.callEndedHandler = handler;
    return () => {
      this.callEndedHandler = null;
    };
  }

  async simulateIncomingCall(
    notification: TelephonyIncomingCallNotification,
  ): Promise<void> {
    if (this.incomingCallHandler !== null) {
      await this.incomingCallHandler(notification);
    }
  }

  async simulateCallEnded(notification: TelephonyCallEndedNotification): Promise<void> {
    if (this.callEndedHandler !== null) {
      await this.callEndedHandler(notification);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

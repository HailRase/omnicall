import type {
  HangupCommand,
  MakeCallCommand,
  RegisterAccountCommand,
  SendDtmfCommand,
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

export type MockTelephonyGatewayOptions = Readonly<{
  registrationScenario?: MockTelephonyScenario;
  makeCallScenario?: MockMakeCallScenario;
  dtmfScenario?: MockDtmfScenario;
  delayMs?: number;
}>;

export class MockTelephonyGateway implements TelephonyGateway {
  private registrationScenario: MockTelephonyScenario;
  private makeCallScenario: MockMakeCallScenario;
  private dtmfScenario: MockDtmfScenario;
  private readonly delayMs: number;
  private registered = false;
  private readonly dialedNumbers: string[] = [];
  private readonly sentTones: string[] = [];
  private readonly hangupCalls: string[] = [];

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
      this.delayMs = delayMs;
      return;
    }

    this.registrationScenario = scenarioOrOptions.registrationScenario ?? "success";
    this.makeCallScenario = scenarioOrOptions.makeCallScenario ?? "answered";
    this.dtmfScenario = scenarioOrOptions.dtmfScenario ?? "success";
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

  hangup(command: HangupCommand): Promise<Result<void, PlatformError>> {
    this.hangupCalls.push(command.callId);
    return Promise.resolve(ok(undefined));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

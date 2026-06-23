import type { RegisterAccountCommand, TelephonyGateway } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type MockTelephonyScenario = "success" | "failure";

export class MockTelephonyGateway implements TelephonyGateway {
  private scenario: MockTelephonyScenario;
  private readonly delayMs: number;
  private registered = false;

  constructor(
    scenario: MockTelephonyScenario = "success",
    delayMs = 0,
  ) {
    this.scenario = scenario;
    this.delayMs = delayMs;
  }

  setScenario(scenario: MockTelephonyScenario): void {
    this.scenario = scenario;
  }

  isRegistered(): boolean {
    return this.registered;
  }

  async register(
    command: RegisterAccountCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    if (this.scenario === "failure") {
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
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

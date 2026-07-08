import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { AuthenticateOcpUseCase } from "./AuthenticateOcpUseCase.js";
import {
  MockOperatorPlatformGateway,
} from "@adapters/mock/MockOperatorPlatformGateway.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("AuthenticateOcpUseCase", () => {
  it("publishes success and sip credentials events", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new AuthenticateOcpUseCase(
      new MockOperatorPlatformGateway({ scenario: "success" }),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      token: "token-1",
      domain: "ocp.example",
    });

    expect(result.ok).toBe(true);
    expect(published).toContain("OcpAuthenticationRequested");
    expect(published).toContain("OcpAuthenticationSucceeded");
    expect(published).toContain("SipCredentialsReceived");
  });

  it("maps session exists to failure event", async () => {
    const events = new InMemoryDomainEventBus();
    let failureReason: string | undefined;

    events.subscribe((event) => {
      if (event.type === "OcpAuthenticationFailed") {
        failureReason = String(event["reason"]);
      }
    });

    const useCase = new AuthenticateOcpUseCase(
      new MockOperatorPlatformGateway({ scenario: "session_exists" }),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      token: "token-1",
      domain: "ocp.example",
    });

    expect(result.ok).toBe(false);
    expect(failureReason).toBe("session_exists");
  });

  it("maps invalid token to failure event", async () => {
    const events = new InMemoryDomainEventBus();
    let failureReason: string | undefined;

    events.subscribe((event) => {
      if (event.type === "OcpAuthenticationFailed") {
        failureReason = String(event["reason"]);
      }
    });

    const useCase = new AuthenticateOcpUseCase(
      new MockOperatorPlatformGateway({ scenario: "invalid_token" }),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      token: "token-1",
      domain: "ocp.example",
    });

    expect(result.ok).toBe(false);
    expect(failureReason).toBe("invalid_token");
  });

  it("publishes AccessDeniedDetected for access denied scenario", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new AuthenticateOcpUseCase(
      new MockOperatorPlatformGateway({ scenario: "access_denied" }),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      token: "token-1",
      domain: "ocp.example",
    });

    expect(result.ok).toBe(false);
    expect(published).toContain("AccessDeniedDetected");
  });
});

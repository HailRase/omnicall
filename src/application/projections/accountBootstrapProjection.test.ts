import { describe, expect, it } from "vitest";
import {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
} from "./accountBootstrapProjection.js";
import {
  createAccessDeniedDetectedEvent,
  createOcpAuthenticationFailedEvent,
  createOcpAuthenticationRequestedEvent,
  createPhoneStatusChangedEvent,
  createRegistrationFailedEvent,
  createRegistrationRequestedEvent,
  createRegistrationSucceededEvent,
  createSipCredentialsReceivedEvent,
  createStartupModeResolvedEvent,
  createUserSessionEndedEvent,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createSipAccountId } from "@domain/index.js";

describe("accountBootstrapProjection", () => {
  it("maps OCP auth loading and invalid token states", () => {
    const correlationId = createCorrelationId();
    let projection = initialAccountBootstrapProjection();

    projection = reduceAccountBootstrapProjection(
      projection,
      createOcpAuthenticationRequestedEvent(correlationId, {
        token: "x",
        domain: "y",
      }),
    );
    expect(projection.authUiState).toBe("ocp_authenticating");

    projection = reduceAccountBootstrapProjection(
      projection,
      createOcpAuthenticationFailedEvent(correlationId, {
        reason: "invalid_token",
        message: "Invalid OCP token",
      }),
    );
    expect(projection.authUiState).toBe("ocp_invalid_token");
  });

  it("maps session exists and access denied states", () => {
    const correlationId = createCorrelationId();
    let projection = initialAccountBootstrapProjection();

    projection = reduceAccountBootstrapProjection(
      projection,
      createOcpAuthenticationFailedEvent(correlationId, {
        reason: "session_exists",
        message: "Session exists",
      }),
    );
    expect(projection.authUiState).toBe("ocp_session_exists");

    projection = reduceAccountBootstrapProjection(
      projection,
      createAccessDeniedDetectedEvent(correlationId, {
        source: "manual",
        reason: "Access denied: username is required",
      }),
    );
    expect(projection.authUiState).toBe("access_denied");
  });

  it("maps startup mode to sip only ready", () => {
    const correlationId = createCorrelationId();
    let projection = initialAccountBootstrapProjection();

    projection = reduceAccountBootstrapProjection(
      projection,
      createStartupModeResolvedEvent(correlationId, {
        mode: "sip-only",
        resolution: { action: "sip_only_ready" },
      }),
    );

    expect(projection.authUiState).toBe("sip_only_ready");
    expect(projection.isOcpMode).toBe(false);
  });

  it("maps registration success to online phone status", () => {
    const correlationId = createCorrelationId();
    let projection = initialAccountBootstrapProjection();

    projection = reduceAccountBootstrapProjection(
      projection,
      createRegistrationRequestedEvent(correlationId, {
        accountId: createSipAccountId("agent"),
      }),
    );

    projection = reduceAccountBootstrapProjection(
      projection,
      createRegistrationSucceededEvent(correlationId, {
        accountId: createSipAccountId("agent"),
      }),
    );

    expect(projection.authUiState).toBe("sip_registered");
    expect(projection.registrationState).toBe("registered");
    expect(projection.phoneStatus).toBe("online");
  });

  it("maps registration failure state", () => {
    const correlationId = createCorrelationId();
    let projection = initialAccountBootstrapProjection();

    projection = reduceAccountBootstrapProjection(
      projection,
      createRegistrationFailedEvent(correlationId, {
        accountId: createSipAccountId("agent"),
        reason: "SIP registration failed",
      }),
    );

    expect(projection.authUiState).toBe("sip_registration_failed");
    expect(projection.lastError).toContain("SIP registration failed");
  });

  it("maps phone status changed event", () => {
    const correlationId = createCorrelationId();
    let projection = initialAccountBootstrapProjection();

    projection = reduceAccountBootstrapProjection(
      projection,
      createPhoneStatusChangedEvent(correlationId, {
        previousStatus: "offline",
        nextStatus: "dnd",
      }),
    );

    expect(projection.phoneStatus).toBe("dnd");
  });

  it("resets to sip_only_ready on UserSessionEnded", () => {
    const sessionCorrelationId = createCorrelationId();
    let projection = initialAccountBootstrapProjection();
    projection = reduceAccountBootstrapProjection(projection, {
      type: "RegistrationSucceeded",
      correlationId: sessionCorrelationId,
      occurredAt: new Date().toISOString(),
      accountId: "acc-1",
    });
    projection = reduceAccountBootstrapProjection(projection, {
      type: "UserSessionEnded",
      correlationId: sessionCorrelationId,
      occurredAt: new Date().toISOString(),
    });

    expect(projection.authUiState).toBe("sip_only_ready");
    expect(projection.registrationState).toBe("idle");
    expect(projection.phoneStatus).toBe("offline");
    expect(projection.sipUsername).toBeNull();
    expect(projection.sipDomain).toBeNull();
  });

  it("stores sip username and domain from SipCredentialsReceived", () => {
    const correlationId = createCorrelationId();
    const projection = reduceAccountBootstrapProjection(
      initialAccountBootstrapProjection(),
      createSipCredentialsReceivedEvent(correlationId, {
        credentials: {
          username: "alex.operator",
          password: "secret",
          domain: "example.com",
          server: "sip.example.com",
        },
        source: "manual",
      }),
    );

    expect(projection.sipUsername).toBe("alex.operator");
    expect(projection.sipDomain).toBe("example.com");
  });

  it("stores sip username from RegistrationRequested account id", () => {
    const correlationId = createCorrelationId();
    const projection = reduceAccountBootstrapProjection(
      initialAccountBootstrapProjection(),
      createRegistrationRequestedEvent(correlationId, {
        accountId: createSipAccountId("1001"),
      }),
    );

    expect(projection.sipUsername).toBe("1001");
    expect(projection.authUiState).toBe("sip_registering");
  });

  it("clears sip username on UserSessionEnded", () => {
    const correlationId = createCorrelationId();
    let projection = reduceAccountBootstrapProjection(
      initialAccountBootstrapProjection(),
      createSipCredentialsReceivedEvent(correlationId, {
        credentials: {
          username: "agent",
          password: "secret",
          domain: "example.com",
          server: "sip.example.com",
        },
        source: "manual",
      }),
    );

    projection = reduceAccountBootstrapProjection(
      projection,
      createUserSessionEndedEvent(correlationId),
    );

    expect(projection.sipUsername).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
} from "./accountBootstrapProjection.js";
import {
  createOcpAuthenticationFailedEvent,
  createOcpAuthenticationRequestedEvent,
  createRegistrationRequestedEvent,
  createRegistrationSucceededEvent,
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
});

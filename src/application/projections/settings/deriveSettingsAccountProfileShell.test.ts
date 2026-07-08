import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createRegistrationSucceededEvent,
  createSipAccountId,
  createSipCredentialsReceivedEvent,
} from "@domain/index.js";
import {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
} from "./accountBootstrapProjection.js";
import { deriveActiveProfileSettingsSyncKey } from "./deriveSettingsAccountProfileShell.js";

describe("deriveActiveProfileSettingsSyncKey", () => {
  it("returns null before SIP registration completes", () => {
    const correlationId = createCorrelationId();
    const afterCredentials = reduceAccountBootstrapProjection(
      initialAccountBootstrapProjection(),
      createSipCredentialsReceivedEvent(correlationId, {
        credentials: {
          username: "1001",
          password: "secret",
          domain: "pbx.example.com",
          server: "wss://sip.example.com",
        },
        source: "manual",
      }),
    );

    expect(deriveActiveProfileSettingsSyncKey(afterCredentials)).toBeNull();
  });

  it("returns composite identity key after successful SIP registration", () => {
    const correlationId = createCorrelationId();
    let projection = reduceAccountBootstrapProjection(
      initialAccountBootstrapProjection(),
      createSipCredentialsReceivedEvent(correlationId, {
        credentials: {
          username: "1001",
          password: "secret",
          domain: "pbx.example.com",
          server: "wss://sip.example.com",
        },
        source: "manual",
      }),
    );
    projection = reduceAccountBootstrapProjection(
      projection,
      createRegistrationSucceededEvent(correlationId, {
        accountId: createSipAccountId("1001"),
      }),
    );

    expect(deriveActiveProfileSettingsSyncKey(projection)).toBe("1001@pbx.example.com");
  });
});

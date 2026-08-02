/**
 * - Purpose: verify External Applications automation opens windows on call events.
 * - Inputs: composed runtime with mock gateways and synthetic Domain events.
 * - Outputs: expected window opens for matching focused apps; skips for invalid URLs.
 */

import { describe, expect, it, vi } from "vitest";
import {
  createCallId,
  createSettingsAccountKey,
  DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
  DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR,
  type ExternalApplicationId,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { MockExternalApplicationWindowGateway } from "@adapters/mock/MockExternalApplicationWindowGateway.js";
import { MockExternalUrlGateway } from "@adapters/mock/MockExternalUrlGateway.js";
import { CryptoUuidGenerator } from "@adapters/platform/CryptoUuidGenerator.js";
import { SystemClock } from "@adapters/platform/SystemClock.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { createExternalApplicationsComposition } from "./ExternalApplicationsComposition.js";

describe("ExternalApplicationsAutomation", () => {
  it("opens one Electron window per matching application on focused incoming ringing", async () => {
    const windowGateway = new MockExternalApplicationWindowGateway();
    const composition = createExternalApplicationsComposition({
      windowGateway,
      externalUrlGateway: new MockExternalUrlGateway(),
      clock: new SystemClock(),
      uuidGenerator: new CryptoUuidGenerator(),
      logger: createTestLogger({ featureId: "F-032", boundedContext: "Integration" }),
    });
    const profileKey = createSettingsAccountKey("agent@pbx.example");
    const appA = "11111111-1111-4111-8111-111111111111" as ExternalApplicationId;
    const appB = "22222222-2222-4222-8222-222222222222" as ExternalApplicationId;
    composition.activateProfile(profileKey, {
      applications: [
        {
          id: appA,
          name: "CRM",
          enabled: true,
          urlTemplate: "https://crm.example/card?id={{call_id}}",
          openMode: "electron_window",
          window: { width: 1100, height: 800 },
          variables: [],
          triggers: [{ eventType: "incoming_ringing", delaySeconds: 0 }],
          conditions: DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
          windowBehavior: DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR,
        },
        {
          id: appB,
          name: "Helpdesk",
          enabled: true,
          urlTemplate: "https://help.example/search?q={{caller_id}}",
          openMode: "electron_window",
          window: { width: 900, height: 700 },
          variables: [],
          triggers: [{ eventType: "incoming_ringing", delaySeconds: 0 }],
          conditions: DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
          windowBehavior: DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR,
        },
      ],
    });

    const callId = createCallId("call-1");
    composition.handleCommittedEvent(
      {
        type: "IncomingCallReceived",
        callId,
        phoneNumber: "79001234567",
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-31T10:00:00.000Z",
      },
      { profileKey, focusedCallId: callId, userLogin: "agent" },
    );
    composition.handleCommittedEvent(
      {
        type: "IncomingCallRingingStarted",
        callId,
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-31T10:00:00.100Z",
      },
      { profileKey, focusedCallId: callId, userLogin: "agent" },
    );

    await vi.waitFor(() => {
      expect(windowGateway.requests).toHaveLength(2);
    });
    expect(windowGateway.requests.map((request) => request.url).sort()).toEqual([
      "https://crm.example/card?id=call-1",
      "https://help.example/search?q=79001234567",
    ]);
  });

  it("skips open when resolved URL is not allowed HTTPS", async () => {
    const windowGateway = new MockExternalApplicationWindowGateway();
    const composition = createExternalApplicationsComposition({
      windowGateway,
      externalUrlGateway: new MockExternalUrlGateway(),
      clock: new SystemClock(),
      uuidGenerator: new CryptoUuidGenerator(),
      logger: createTestLogger({ featureId: "F-032", boundedContext: "Integration" }),
    });
    const profileKey = createSettingsAccountKey("agent@pbx.example");
    const appId = "33333333-3333-4333-8333-333333333333" as ExternalApplicationId;
    composition.activateProfile(profileKey, {
      applications: [
        {
          id: appId,
          name: "Bad",
          enabled: true,
          urlTemplate: "ftp://evil.example/{{call_id}}",
          openMode: "electron_window",
          window: { width: 1100, height: 800 },
          variables: [],
          triggers: [{ eventType: "outgoing_connecting", delaySeconds: 0 }],
          conditions: DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
          windowBehavior: DEFAULT_EXTERNAL_APPLICATION_WINDOW_BEHAVIOR,
        },
      ],
    });
    const callId = createCallId("call-2");
    composition.handleCommittedEvent(
      {
        type: "OutgoingCallRequested",
        callId,
        phoneNumber: "100",
        correlationId: createCorrelationId(),
        occurredAt: "2026-07-31T10:01:00.000Z",
      },
      { profileKey, focusedCallId: callId, userLogin: "agent" },
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(windowGateway.requests).toHaveLength(0);
  });
});

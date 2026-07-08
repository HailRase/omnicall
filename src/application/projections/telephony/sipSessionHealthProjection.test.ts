import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createSipAccountId } from "@domain/index.js";
import {
  createRegistrationFailedEvent,
  createRegistrationRequestedEvent,
  createRegistrationSucceededEvent,
} from "@domain/telephony/events/registrationEvents.js";
import {
  createSipRegistrationRetryAttemptStartedEvent,
  createSipRegistrationRetryScheduledEvent,
  createSipRegistrationRetrySucceededEvent,
} from "@domain/telephony/events/sipRegistrationRetryEvents.js";
import {
  createManualSipReregisterRequestedEvent,
  createManualSipTransportReconnectRequestedEvent,
  createSipRegistrationClearedEvent,
  createSipSessionActivatedEvent,
  createSipSessionResetEvent,
  createSipTransportConnectedEvent,
  createSipTransportConnectingEvent,
  createSipTransportDisconnectedEvent,
  createSipTransportReconnectAttemptStartedEvent,
  createSipTransportReconnectFailedEvent,
  createSipTransportReconnectScheduledEvent,
  createSipTransportReconnectSucceededEvent,
} from "@domain/telephony/events/sipTransportEvents.js";
import {
  initialSipSessionHealthProjection,
  reduceSipSessionHealthProjection,
} from "./sipSessionHealthProjection.js";

describe("sipSessionHealthProjection", () => {
  const correlationId = createCorrelationId();
  const accountId = createSipAccountId("agent-1");

  it("starts fully idle", () => {
    const projection = initialSipSessionHealthProjection();
    expect(projection.lifecycle).toBe("idle");
    expect(projection.transport).toBe("idle");
    expect(projection.registration).toBe("idle");
    expect(projection.recovery.target).toBeNull();
  });

  it("activates lifecycle on SipSessionActivated", () => {
    const projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipSessionActivatedEvent(correlationId),
    );
    expect(projection.lifecycle).toBe("active");
    expect(projection.transport).toBe("connecting");
  });

  it("tracks transport connect and registration success", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createRegistrationRequestedEvent(correlationId, { accountId }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipTransportConnectingEvent(correlationId),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipTransportConnectedEvent(correlationId),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createRegistrationSucceededEvent(correlationId, { accountId }),
    );

    expect(projection.transport).toBe("connected");
    expect(projection.registration).toBe("registered");
    expect(projection.recovery.target).toBeNull();
  });

  it("promotes transport to connected when registration succeeds before transport connected event", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createRegistrationRequestedEvent(correlationId, { accountId }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipTransportConnectingEvent(correlationId),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createRegistrationSucceededEvent(correlationId, { accountId }),
    );

    expect(projection.transport).toBe("connected");
    expect(projection.registration).toBe("registered");
  });

  it("clears registration on transport disconnect", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createRegistrationSucceededEvent(correlationId, { accountId }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipTransportDisconnectedEvent(correlationId, { reason: "transport_closed" }),
    );

    expect(projection.transport).toBe("disconnected");
    expect(projection.registration).toBe("idle");
  });

  it("schedules transport recovery with countdown", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipTransportDisconnectedEvent(correlationId, { reason: "transport_closed" }),
    );

    const scheduledEvent = {
      ...createSipTransportReconnectScheduledEvent(correlationId, {
        attemptNumber: 2,
        delayMs: 5000,
      }),
      occurredAt: "2026-06-24T10:00:00.000Z",
    };
    projection = reduceSipSessionHealthProjection(projection, scheduledEvent);

    expect(projection.transport).toBe("reconnecting");
    expect(projection.recovery.target).toBe("transport");
    expect(projection.recovery.attemptNumber).toBe(2);
    expect(projection.recovery.nextRetryAt).toBe("2026-06-24T10:00:05.000Z");
  });

  it("moves to connecting on transport reconnect attempt started", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipTransportReconnectScheduledEvent(correlationId, {
        attemptNumber: 1,
        delayMs: 5000,
      }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipTransportReconnectAttemptStartedEvent(correlationId, { attemptNumber: 1 }),
    );

    expect(projection.transport).toBe("connecting");
  });

  it("restores connected transport without registration on reconnect success", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipTransportDisconnectedEvent(correlationId, { reason: "transport_closed" }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipTransportReconnectSucceededEvent(correlationId, { attemptNumber: 1 }),
    );

    expect(projection.transport).toBe("connected");
    expect(projection.registration).toBe("idle");
    expect(projection.recovery.target).toBeNull();
  });

  it("marks terminal transport failure", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipTransportReconnectScheduledEvent(correlationId, {
        attemptNumber: 5,
        delayMs: 5000,
      }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipTransportReconnectFailedEvent(correlationId, {
        attemptNumber: 5,
        reason: "max_attempts",
        isTerminal: true,
      }),
    );

    expect(projection.transport).toBe("disconnected");
    expect(projection.recovery.lastFailureReason).toBe("max_attempts");
  });

  it("tracks registration retry lifecycle", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipTransportConnectedEvent(correlationId),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createRegistrationFailedEvent(correlationId, {
        accountId,
        reason: "server_error",
      }),
    );

    const scheduledEvent = {
      ...createSipRegistrationRetryScheduledEvent(correlationId, {
        attemptNumber: 1,
        delayMs: 3000,
      }),
      occurredAt: "2026-06-24T10:00:00.000Z",
    };
    projection = reduceSipSessionHealthProjection(projection, scheduledEvent);
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipRegistrationRetryAttemptStartedEvent(correlationId, { attemptNumber: 1 }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipRegistrationRetrySucceededEvent(correlationId, { attemptNumber: 1 }),
    );

    expect(projection.transport).toBe("connected");
    expect(projection.registration).toBe("registered");
    expect(projection.recovery.target).toBeNull();
  });

  it("clears registration recovery on SipRegistrationCleared", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipRegistrationRetryScheduledEvent(correlationId, {
        attemptNumber: 1,
        delayMs: 5000,
      }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipRegistrationClearedEvent(correlationId, { reason: "transport_lost" }),
    );

    expect(projection.registration).toBe("idle");
    expect(projection.recovery.target).toBeNull();
  });

  it("keeps attempt number on manual transport reconnect", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipTransportReconnectScheduledEvent(correlationId, {
        attemptNumber: 3,
        delayMs: 5000,
      }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createManualSipTransportReconnectRequestedEvent(correlationId),
    );

    expect(projection.recovery.attemptNumber).toBe(3);
    expect(projection.recovery.nextRetryAt).toBeNull();
  });

  it("guards manual reregister when transport is down", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipTransportDisconnectedEvent(correlationId, { reason: "transport_closed" }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createManualSipReregisterRequestedEvent(correlationId),
    );

    expect(projection.registration).toBe("idle");
    expect(projection.recovery.target).toBeNull();
  });

  it("drops registered state on runtime RegistrationFailed while transport is up", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createSipTransportConnectedEvent(correlationId),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createRegistrationSucceededEvent(correlationId, { accountId: createSipAccountId("agent") }),
    );
    expect(projection.registration).toBe("registered");

    projection = reduceSipSessionHealthProjection(
      projection,
      createRegistrationFailedEvent(correlationId, {
        accountId: createSipAccountId("agent"),
        reason: "forbidden",
      }),
    );

    expect(projection.transport).toBe("connected");
    expect(projection.registration).toBe("failed");
    expect(projection.recovery.lastFailureReason).toBe("forbidden");
  });

  it("resets to idle on SipSessionReset", () => {
    let projection = reduceSipSessionHealthProjection(
      initialSipSessionHealthProjection(),
      createRegistrationSucceededEvent(correlationId, { accountId }),
    );
    projection = reduceSipSessionHealthProjection(
      projection,
      createSipSessionResetEvent(correlationId),
    );

    expect(projection).toEqual(initialSipSessionHealthProjection());
  });
});

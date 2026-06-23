import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createOcpNotificationReceivedEvent } from "@domain/index.js";
import {
  initialOcpNotificationProjection,
  reduceOcpNotificationProjection,
} from "./ocpNotificationProjection.js";

describe("ocpNotificationProjection", () => {
  const correlationId = createCorrelationId();

  it("stores toast after OCP auth and notification event", () => {
    let projection = reduceOcpNotificationProjection(initialOcpNotificationProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "s1",
      agentId: "a1",
    });

    projection = reduceOcpNotificationProjection(
      projection,
      createOcpNotificationReceivedEvent(correlationId, {
        notificationId: "n1",
        message: "Status changed",
        level: "info",
      }),
    );

    expect(projection.toasts).toHaveLength(1);
    expect(projection.toasts[0]?.message).toBe("Status changed");
  });

  it("hides toasts in SIP-only mode", () => {
    const projection = reduceOcpNotificationProjection(
      initialOcpNotificationProjection(),
      createOcpNotificationReceivedEvent(correlationId, {
        notificationId: "n2",
        message: "Hidden",
        level: "warn",
      }),
    );

    expect(projection.toasts).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createOcpNotificationReceivedEvent } from "./ocpNotificationEvents.js";

describe("ocpNotificationEvents", () => {
  it("creates OcpNotificationReceived with level", () => {
    const event = createOcpNotificationReceivedEvent(createCorrelationId(), {
      notificationId: "notif-1",
      message: "Agent status updated",
      level: "info",
    });

    expect(event.type).toBe("OcpNotificationReceived");
    expect(event.message).toBe("Agent status updated");
    expect(event.level).toBe("info");
  });
});

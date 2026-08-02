import { describe, expect, it } from "vitest";
import { MockNotificationGateway } from "./MockNotificationGateway.js";

describe("MockNotificationGateway", () => {
  it("records present and dismiss without OS side effects", async () => {
    const gateway = new MockNotificationGateway();
    await gateway.present({
      id: "n-1",
      title: "Fault",
      body: "Headset disconnected",
      module: "headset",
      correlationId: null,
      urgency: "important",
    });
    await gateway.dismiss({ id: "n-1" });
    expect(gateway.presented).toHaveLength(1);
    expect(gateway.presented[0]?.module).toBe("headset");
    expect(gateway.dismissed).toEqual([{ id: "n-1" }]);
  });
});

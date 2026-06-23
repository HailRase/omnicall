import { describe, expect, it } from "vitest";
import { mapTelephonyIncomingNotification } from "./mapTelephonyIncomingNotification.js";

describe("mapTelephonyIncomingNotification", () => {
  it("maps raw payload to typed incoming notification", () => {
    const mapped = mapTelephonyIncomingNotification({
      callId: "in-100",
      fromHeader: "\"Bob\" <sip:1003@example.com>",
      remoteNumber: "fallback",
    });

    expect(mapped.callId).toBe("in-100");
    expect(mapped.remoteNumber).toBe("1003");
    expect(mapped.remoteDisplayNameRaw).toBe("Bob");
  });
});

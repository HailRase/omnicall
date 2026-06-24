import { describe, expect, it } from "vitest";
import { mapCallFailureReason } from "./CallFailureReason.js";

describe("CallFailureReason", () => {
  it("maps busy failure", () => {
    expect(mapCallFailureReason("SIP 486 Busy Here")).toBe("busy");
  });

  it("maps rejected failure", () => {
    expect(mapCallFailureReason("rejected by remote")).toBe("rejected");
  });

  it("maps unavailable failure", () => {
    expect(mapCallFailureReason("480 Temporarily unavailable")).toBe("unavailable");
  });

  it("maps media permission denial to network failure", () => {
    expect(mapCallFailureReason("User Denied Media Access")).toBe("network");
  });
});


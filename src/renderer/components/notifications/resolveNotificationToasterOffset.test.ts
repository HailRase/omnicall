import { describe, expect, it } from "vitest";
import { resolveNotificationToasterOffset } from "./resolveNotificationToasterOffset.js";

describe("resolveNotificationToasterOffset", () => {
  it("keeps top-right within the compact shell edge", () => {
    expect(resolveNotificationToasterOffset("top-right")).toEqual({
      top: "var(--incoming-call-banner-top)",
      right: 24,
      bottom: 24,
      left: 24,
    });
  });

  it("keeps top-left within the compact shell edge", () => {
    expect(resolveNotificationToasterOffset("top-left")).toEqual({
      top: "var(--incoming-call-banner-top)",
      right: 24,
      bottom: 24,
      left: 24,
    });
  });

  it("keeps bottom placements on edge padding without chrome side insets", () => {
    expect(resolveNotificationToasterOffset("bottom-right")).toEqual({
      top: 24,
      right: 24,
      bottom: 24,
      left: 24,
    });
    expect(resolveNotificationToasterOffset("bottom-left")).toEqual({
      top: 24,
      right: 24,
      bottom: 24,
      left: 24,
    });
  });
});

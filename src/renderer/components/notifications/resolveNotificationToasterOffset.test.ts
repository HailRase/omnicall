import { describe, expect, it } from "vitest";
import { resolveNotificationToasterOffset } from "./resolveNotificationToasterOffset.js";

describe("resolveNotificationToasterOffset", () => {
  it("clears titlebar and trailing window controls for top-right", () => {
    expect(resolveNotificationToasterOffset("top-right")).toEqual({
      top: "var(--incoming-call-banner-top)",
      right: "calc(24px + var(--shell-window-controls-safe-inline-end))",
      bottom: 24,
      left: 24,
    });
  });

  it("clears titlebar and leading traffic lights for top-left", () => {
    expect(resolveNotificationToasterOffset("top-left")).toEqual({
      top: "var(--incoming-call-banner-top)",
      right: 24,
      bottom: 24,
      left: "calc(24px + var(--shell-window-controls-safe-inline-start))",
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

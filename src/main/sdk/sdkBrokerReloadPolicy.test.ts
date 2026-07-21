import { describe, expect, it } from "vitest";

import { shouldClearBrokerReadyOnNavigation } from "./sdkBrokerReloadPolicy.js";

describe("shouldClearBrokerReadyOnNavigation", () => {
  it("clears ready on main-frame document navigation (full reload)", () => {
    expect(
      shouldClearBrokerReadyOnNavigation({
        isMainFrame: true,
        isSameDocument: false,
      }),
    ).toBe(true);
  });

  it("keeps ready on same-document main-frame navigation", () => {
    expect(
      shouldClearBrokerReadyOnNavigation({
        isMainFrame: true,
        isSameDocument: true,
      }),
    ).toBe(false);
  });

  it("keeps ready on subframe document navigation", () => {
    expect(
      shouldClearBrokerReadyOnNavigation({
        isMainFrame: false,
        isSameDocument: false,
      }),
    ).toBe(false);
  });

  it("keeps ready on subframe same-document navigation", () => {
    expect(
      shouldClearBrokerReadyOnNavigation({
        isMainFrame: false,
        isSameDocument: true,
      }),
    ).toBe(false);
  });
});

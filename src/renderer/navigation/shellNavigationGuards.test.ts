import { describe, expect, it } from "vitest";
import {
  applyShellNavigationTargetGuard,
  resolveShellRoutePresentation,
} from "./shellNavigationGuards.js";

describe("shellNavigationGuards", () => {
  it("uses sidebar history presentation during active call context", () => {
    expect(
      resolveShellRoutePresentation(
        { name: "history" },
        { hasActiveCallContext: true },
      ),
    ).toBe("sidebar");
  });

  it("uses full panel history presentation when idle", () => {
    expect(
      resolveShellRoutePresentation(
        { name: "history" },
        { hasActiveCallContext: false },
      ),
    ).toBe("fullPanel");
  });

  it("keeps contacts routes in sidebar presentation", () => {
    expect(
      resolveShellRoutePresentation(
        { name: "contactEdit", contactId: "a", notFound: false },
        { hasActiveCallContext: false },
      ),
    ).toBe("sidebar");
  });

  it("redirects empty contact targets to dialpad", () => {
    expect(
      applyShellNavigationTargetGuard({ name: "contactDetails", contactId: "   " }),
    ).toEqual({ name: "dialpad" });
  });
});

import { describe, expect, it } from "vitest";
import { shellRouteToPath } from "./shellRoutePaths.js";

describe("shellRouteToPath", () => {
  it("maps typed shell routes to hash-router paths", () => {
    expect(shellRouteToPath({ name: "dialpad" })).toBe("/");
    expect(shellRouteToPath({ name: "history" })).toBe("/history");
    expect(shellRouteToPath({ name: "historyDetails", entryId: "history-call-1" })).toBe(
      "/history/history-call-1",
    );
    expect(shellRouteToPath({ name: "contacts" })).toBe("/contacts");
    expect(shellRouteToPath({ name: "contactDetails", contactId: "agent-1" })).toBe(
      "/contacts/agent-1",
    );
    expect(shellRouteToPath({ name: "contactEdit", contactId: "agent-1" })).toBe(
      "/contacts/agent-1/edit",
    );
    expect(shellRouteToPath({ name: "settings" })).toBe("/settings");
    expect(shellRouteToPath({ name: "settings", section: "general" })).toBe("/settings/general");
    expect(shellRouteToPath({ name: "settings", section: "diagnostics" })).toBe(
      "/settings/diagnostics",
    );
  });
});

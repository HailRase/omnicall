import { describe, expect, it } from "vitest";
import { resolveOcpStatusLabelKey } from "./useOcpSettingsPanel.js";

describe("resolveOcpStatusLabelKey", () => {
  it("returns disabled when module is off", () => {
    expect(resolveOcpStatusLabelKey(false, "authenticated")).toBe(
      "settings.integrations.ocp.status.disabled",
    );
  });

  it("maps connection states", () => {
    expect(resolveOcpStatusLabelKey(true, "connecting")).toBe(
      "settings.integrations.ocp.status.connecting",
    );
    expect(resolveOcpStatusLabelKey(true, "failed")).toBe(
      "settings.integrations.ocp.status.failed",
    );
    expect(resolveOcpStatusLabelKey(true, "disconnected")).toBe(
      "settings.integrations.ocp.status.disconnected",
    );
  });
});

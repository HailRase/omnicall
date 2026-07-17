import { describe, expect, it } from "vitest";
import {
  resolveOcpAuthorizationStatusLabelKey,
  resolveOcpServerStatusLabelKey,
} from "./useOcpSettingsPanel.js";

describe("resolveOcpServerStatusLabelKey", () => {
  it("maps server states", () => {
    expect(resolveOcpServerStatusLabelKey("connecting")).toBe(
      "account.server.status.connecting",
    );
    expect(resolveOcpServerStatusLabelKey("failed")).toBe(
      "account.server.status.failed",
    );
    expect(resolveOcpServerStatusLabelKey("disconnected")).toBe(
      "account.server.status.disconnected",
    );
  });
});

describe("resolveOcpAuthorizationStatusLabelKey", () => {
  it("maps authorization phases", () => {
    expect(resolveOcpAuthorizationStatusLabelKey({ phase: "pending" })).toBe(
      "account.authorization.status.pending",
    );
    expect(
      resolveOcpAuthorizationStatusLabelKey({
        phase: "rejected",
        reason: "INVALID_TOKEN",
      }),
    ).toBe("account.authorization.status.rejected");
    expect(resolveOcpAuthorizationStatusLabelKey({ phase: "idle" })).toBe(
      "account.authorization.status.idle",
    );
  });
});

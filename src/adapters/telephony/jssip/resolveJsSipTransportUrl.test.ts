import { describe, expect, it } from "vitest";
import { resolveJsSipTransportUrl } from "./resolveJsSipTransportUrl.js";

describe("resolveJsSipTransportUrl", () => {
  it("builds wss transport from host:port without scheme", () => {
    expect(resolveJsSipTransportUrl("onedemoserver.online:5063")).toBe(
      "wss://onedemoserver.online:5063/",
    );
  });

  it("preserves explicit port from wss URL and adds trailing slash", () => {
    expect(resolveJsSipTransportUrl("wss://onedemoserver.online:5063")).toBe(
      "wss://onedemoserver.online:5063/",
    );
  });

  it("uses default secure port 5063 when port omitted", () => {
    expect(resolveJsSipTransportUrl("pbx.example.com")).toBe(
      "wss://pbx.example.com:5063/",
    );
  });

  it("uses default insecure port 5062 for ws scheme", () => {
    expect(resolveJsSipTransportUrl("ws://pbx.example.com")).toBe(
      "ws://pbx.example.com:5062/",
    );
  });

  it("strips trailing slashes from input before normalization", () => {
    expect(resolveJsSipTransportUrl("onedemoserver.online:5063///")).toBe(
      "wss://onedemoserver.online:5063/",
    );
  });
});

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

  it("uses default port 80 for ws URL without explicit port", () => {
    expect(resolveJsSipTransportUrl("ws://pbx.example.com")).toBe(
      "ws://pbx.example.com:80/",
    );
  });

  it("strips trailing slashes from input before normalization", () => {
    expect(resolveJsSipTransportUrl("onedemoserver.online:5063///")).toBe(
      "wss://onedemoserver.online:5063/",
    );
  });

  it("preserves websocket path segment from explicit wss URL", () => {
    expect(resolveJsSipTransportUrl("wss://dev-qms.onedemoserver.online:443/ws")).toBe(
      "wss://dev-qms.onedemoserver.online:443/ws/",
    );
  });

  it("uses default port 443 for wss URL with path and no explicit port", () => {
    expect(resolveJsSipTransportUrl("wss://dev-qms.onedemoserver.online/ws")).toBe(
      "wss://dev-qms.onedemoserver.online:443/ws/",
    );
  });
});

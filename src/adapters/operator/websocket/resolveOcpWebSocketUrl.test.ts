import { describe, expect, it } from "vitest";
import { resolveOcpWebSocketUrl } from "./resolveOcpWebSocketUrl.js";

describe("resolveOcpWebSocketUrl", () => {
  it("normalizes explicit wss URL", () => {
    expect(resolveOcpWebSocketUrl("wss://dev-qms.example.com/ws", undefined)).toBe(
      "wss://dev-qms.example.com/ws/",
    );
  });

  it("derives ws URL from domain when explicit URL missing", () => {
    expect(resolveOcpWebSocketUrl(undefined, "dev-qms.example.com")).toBe(
      "wss://dev-qms.example.com/ws/",
    );
  });

  it("returns null when neither url nor domain provided", () => {
    expect(resolveOcpWebSocketUrl(undefined, undefined)).toBeNull();
  });
});

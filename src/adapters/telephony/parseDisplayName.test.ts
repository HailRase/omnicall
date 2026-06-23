import { describe, expect, it } from "vitest";
import { parseDisplayName } from "./parseDisplayName.js";

describe("parseDisplayName", () => {
  it("parses quoted display name with sip uri", () => {
    expect(parseDisplayName("\"Alice\" <sip:1001@example.com>")).toEqual({
      displayName: "Alice",
      number: "1001",
    });
  });

  it("parses uri-only value", () => {
    expect(parseDisplayName("<sip:1002@example.com>")).toEqual({
      displayName: null,
      number: "1002",
    });
  });

  it("handles malformed and empty payloads", () => {
    expect(parseDisplayName("")).toEqual({ displayName: null, number: null });
    expect(parseDisplayName({})).toEqual({ displayName: null, number: null });
  });
});

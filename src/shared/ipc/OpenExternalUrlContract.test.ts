import { describe, expect, it } from "vitest";
import { parseOpenExternalUrlPayload } from "./OpenExternalUrlContract.js";

describe("OpenExternalUrlContract", () => {
  it("parses valid https payload", () => {
    expect(parseOpenExternalUrlPayload({ url: "https://example.com/download" })).toEqual({
      url: "https://example.com/download",
    });
  });

  it("rejects invalid payloads", () => {
    expect(parseOpenExternalUrlPayload(null)).toBeNull();
    expect(parseOpenExternalUrlPayload({ url: "ftp://example.com" })).toBeNull();
    expect(parseOpenExternalUrlPayload({ url: "http://example.com" })).toBeNull();
  });
});

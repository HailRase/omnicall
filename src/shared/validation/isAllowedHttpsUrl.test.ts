import { describe, expect, it } from "vitest";
import { isAllowedHttpsUrl } from "./isAllowedHttpsUrl.js";

describe("isAllowedHttpsUrl", () => {
  it("allows https URLs", () => {
    expect(isAllowedHttpsUrl("https://example.com/releases")).toBe(true);
  });

  it("allows localhost http for tests", () => {
    expect(isAllowedHttpsUrl("http://localhost:3000/manifest.json")).toBe(true);
  });

  it("rejects insecure remote http", () => {
    expect(isAllowedHttpsUrl("http://example.com/releases")).toBe(false);
  });
});

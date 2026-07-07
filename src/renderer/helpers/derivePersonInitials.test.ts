import { describe, expect, it } from "vitest";
import { derivePersonInitials } from "./derivePersonInitials.js";

describe("derivePersonInitials", () => {
  it("derives two-letter initials from full name", () => {
    expect(derivePersonInitials("Alice Brown")).toBe("AB");
  });

  it("derives digits from phone-like labels", () => {
    expect(derivePersonInitials("+1 (202) 555-0100")).toBe("00");
  });

  it("returns fallback for empty labels", () => {
    expect(derivePersonInitials("   ")).toBe("?");
  });
});

import { describe, expect, it } from "vitest";
import {
  createPhoneNumber,
  normalizePhoneNumber,
  validatePhoneNumber,
} from "./PhoneNumber.js";

describe("PhoneNumber", () => {
  it("normalizes spaces and separators", () => {
    expect(normalizePhoneNumber(" +1 (202) 555-0147 ")).toBe("+12025550147");
  });

  it("accepts valid local number", () => {
    expect(validatePhoneNumber("2025550147")).toEqual([]);
  });

  it("accepts valid e164 number", () => {
    expect(validatePhoneNumber("+12025550147")).toEqual([]);
    expect(createPhoneNumber("+1 (202) 555-0147")).toBe("+12025550147");
  });

  it("accepts single-digit local extension", () => {
    expect(validatePhoneNumber("1")).toEqual([]);
    expect(validatePhoneNumber("12")).toEqual([]);
  });

  it("rejects empty, too long, and invalid symbols", () => {
    expect(validatePhoneNumber("   ")).toEqual(["number_required"]);
    expect(validatePhoneNumber("12abc3")).toEqual(["number_invalid_characters"]);
    expect(validatePhoneNumber("1234567890123456")).toEqual(["number_too_long"]);
  });
});


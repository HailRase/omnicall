import { describe, expect, it } from "vitest";
import {
  DEFAULT_SUPPORTED_LANGUAGE,
  parseSupportedLanguage,
  SUPPORTED_LANGUAGES,
} from "./SupportedLanguage.js";

describe("SupportedLanguage", () => {
  it("exposes ru, en, fr, de and bg locales", () => {
    expect(SUPPORTED_LANGUAGES).toEqual(["ru", "en", "fr", "de", "bg"]);
    expect(DEFAULT_SUPPORTED_LANGUAGE).toBe("ru");
  });

  it("parses known locale values", () => {
    expect(parseSupportedLanguage("ru")).toBe("ru");
    expect(parseSupportedLanguage("en")).toBe("en");
    expect(parseSupportedLanguage("fr")).toBe("fr");
    expect(parseSupportedLanguage("de")).toBe("de");
    expect(parseSupportedLanguage("bg")).toBe("bg");
  });

  it("rejects unknown locale values", () => {
    expect(parseSupportedLanguage("es")).toBeNull();
    expect(parseSupportedLanguage(null)).toBeNull();
  });
});

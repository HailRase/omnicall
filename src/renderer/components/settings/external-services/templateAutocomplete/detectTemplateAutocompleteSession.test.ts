import { describe, expect, it } from "vitest";
import {
  applyTemplateAutocompleteSelection,
  detectTemplateAutocompleteSession,
} from "./detectTemplateAutocompleteSession.js";

describe("detectTemplateAutocompleteSession", () => {
  it("opens after {{ with empty prefix", () => {
    expect(detectTemplateAutocompleteSession("https://x/{{", 12)).toEqual({
      openIndex: 10,
      replaceEnd: 12,
      prefix: "",
    });
  });

  it("filters prefix as typed characters after {{", () => {
    expect(detectTemplateAutocompleteSession("{{ba", 4)).toEqual({
      openIndex: 0,
      replaceEnd: 4,
      prefix: "ba",
    });
  });

  it("does not open on a single brace", () => {
    expect(detectTemplateAutocompleteSession("{", 1)).toBeNull();
    expect(detectTemplateAutocompleteSession('{"a":1}', 1)).toBeNull();
  });

  it("closes when name prefix contains invalid characters", () => {
    expect(detectTemplateAutocompleteSession("{{base url", 10)).toBeNull();
    expect(detectTemplateAutocompleteSession("{{base-url", 10)).toBeNull();
  });

  it("opens on the nearest trailing {{ even after an extra brace", () => {
    expect(detectTemplateAutocompleteSession("{{{", 3)).toEqual({
      openIndex: 1,
      replaceEnd: 3,
      prefix: "",
    });
  });

  it("closes when a closing brace appears inside the open token", () => {
    expect(detectTemplateAutocompleteSession("{{}", 3)).toBeNull();
  });

  it("closes after a completed token when caret is past }}", () => {
    expect(detectTemplateAutocompleteSession("{{call_id}}", 11)).toBeNull();
  });

  it("reopens inside an existing token and extends replace range through }}", () => {
    expect(detectTemplateAutocompleteSession("{{call_id}}/x", 6)).toEqual({
      openIndex: 0,
      replaceEnd: 11,
      prefix: "call",
    });
  });

  it("uses the nearest unclosed {{ before the caret", () => {
    expect(detectTemplateAutocompleteSession("{{a}}{{b", 8)).toEqual({
      openIndex: 5,
      replaceEnd: 8,
      prefix: "b",
    });
  });

  it("keeps case-sensitive prefix for filtering", () => {
    expect(detectTemplateAutocompleteSession("{{Call", 6)?.prefix).toBe("Call");
  });
});

describe("applyTemplateAutocompleteSelection", () => {
  it("replaces the open token with a completed placeholder", () => {
    const session = detectTemplateAutocompleteSession("https://{{ba", 12);
    expect(session).not.toBeNull();
    if (session === null) {
      return;
    }
    expect(applyTemplateAutocompleteSelection("https://{{ba", session, "base_url")).toEqual({
      nextValue: "https://{{base_url}}",
      nextCaret: 20,
    });
  });

  it("replaces an existing token when caret is mid-name", () => {
    const value = "x={{call_id}}y";
    const session = detectTemplateAutocompleteSession(value, 6);
    expect(session).not.toBeNull();
    if (session === null) {
      return;
    }
    expect(applyTemplateAutocompleteSelection(value, session, "caller_id")).toEqual({
      nextValue: "x={{caller_id}}y",
      nextCaret: 15,
    });
  });
});

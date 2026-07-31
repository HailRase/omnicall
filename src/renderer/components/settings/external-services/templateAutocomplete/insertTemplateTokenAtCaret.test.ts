import { describe, expect, it } from "vitest";
import { insertTemplateTokenAtCaret } from "./insertTemplateTokenAtCaret.js";

describe("insertTemplateTokenAtCaret", () => {
  it("appends when caret is unknown", () => {
    expect(insertTemplateTokenAtCaret("https://x", "{{call_id}}", null)).toEqual({
      nextValue: "https://x{{call_id}}",
      nextCaret: 20,
    });
  });

  it("inserts at the caret when known", () => {
    expect(insertTemplateTokenAtCaret("https://x/y", "{{call_id}}", 10)).toEqual({
      nextValue: "https://x/{{call_id}}y",
      nextCaret: 21,
    });
  });
});

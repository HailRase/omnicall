import { describe, expect, it } from "vitest";
import { parseContactId } from "./contactIdValidation.js";

describe("parseContactId", () => {
  it("accepts trimmed alphanumeric ids", () => {
    expect(parseContactId("agent-42")).toBe("agent-42");
  });

  it("rejects empty and invalid characters", () => {
    expect(parseContactId(undefined)).toBeNull();
    expect(parseContactId("")).toBeNull();
    expect(parseContactId("   ")).toBeNull();
    expect(parseContactId("bad/id")).toBeNull();
    expect(parseContactId("bad id")).toBeNull();
  });
});

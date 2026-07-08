import { describe, expect, it } from "vitest";
import { createSavedAccountProfile } from "@domain/index.js";
import { deriveSavedAccountProfileSelectorOptions } from "./deriveSavedAccountProfileSelectorOptions.js";

describe("deriveSavedAccountProfileSelectorOptions", () => {
  it("maps profiles to id/label pairs", () => {
    const first = createSavedAccountProfile({
      username: "1001",
      domain: "pbx.example.com",
      server: "wss://sip.example.com",
    });
    const second = createSavedAccountProfile({
      username: "1002",
      domain: "pbx.example.com",
      server: "wss://sip.example.com",
    });

    if (!first.ok || !second.ok) {
      throw new Error("fixture failed");
    }

    expect(deriveSavedAccountProfileSelectorOptions([first.value, second.value])).toEqual([
      { id: first.value.id, label: "1001" },
      { id: second.value.id, label: "1002" },
    ]);
  });
});

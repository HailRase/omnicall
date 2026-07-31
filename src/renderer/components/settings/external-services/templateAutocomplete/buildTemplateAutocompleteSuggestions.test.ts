import { describe, expect, it } from "vitest";
import {
  buildTemplateAutocompleteSuggestions,
  filterTemplateAutocompleteSuggestions,
} from "./buildTemplateAutocompleteSuggestions.js";

describe("buildTemplateAutocompleteSuggestions", () => {
  it("lists system names first and unique collection keys after", () => {
    const items = buildTemplateAutocompleteSuggestions(["base_url", " call_id ", "api_token", ""]);
    expect(items.some((item) => item.name === "call_id" && item.kind === "system")).toBe(true);
    expect(items.filter((item) => item.name === "call_id")).toHaveLength(1);
    expect(items.find((item) => item.name === "base_url")).toEqual({
      name: "base_url",
      kind: "collection",
    });
    expect(items.find((item) => item.name === "api_token")).toEqual({
      name: "api_token",
      kind: "collection",
    });
  });
});

describe("filterTemplateAutocompleteSuggestions", () => {
  const items = buildTemplateAutocompleteSuggestions(["base_url", "api_token"]);

  it("returns all suggestions for an empty prefix", () => {
    expect(filterTemplateAutocompleteSuggestions(items, "")).toEqual(items);
  });

  it("filters with case-sensitive startsWith", () => {
    const filtered = filterTemplateAutocompleteSuggestions(items, "b");
    expect(filtered.map((item) => item.name)).toEqual(["base_url"]);
    expect(filterTemplateAutocompleteSuggestions(items, "B")).toEqual([]);
  });
});

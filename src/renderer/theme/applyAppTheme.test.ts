// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { applyAppTheme } from "./applyAppTheme.js";

afterEach(() => {
  delete document.documentElement.dataset["theme"];
});

describe("applyAppTheme", () => {
  it("sets data-theme on documentElement", () => {
    applyAppTheme("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");

    applyAppTheme("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });
});

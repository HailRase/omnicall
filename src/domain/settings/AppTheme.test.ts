import { describe, expect, it } from "vitest";
import { DEFAULT_APP_THEME, parseAppTheme } from "./AppTheme.js";

describe("parseAppTheme", () => {
  it("accepts supported theme values", () => {
    expect(parseAppTheme("light")).toBe("light");
    expect(parseAppTheme("dark")).toBe("dark");
  });

  it("rejects unknown values", () => {
    expect(parseAppTheme("auto")).toBeNull();
    expect(parseAppTheme(null)).toBeNull();
  });

  it("defaults to light theme constant", () => {
    expect(DEFAULT_APP_THEME).toBe("light");
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_SESSION_VIEW_MODE,
  isSessionViewMode,
  parseSessionViewMode,
  SESSION_VIEW_MODES,
} from "./SessionViewMode.js";

describe("SessionViewMode", () => {
  it("exposes expanded, hidden, and fullscreen", () => {
    expect(SESSION_VIEW_MODES).toEqual(["expanded", "hidden", "fullscreen"]);
    expect(DEFAULT_SESSION_VIEW_MODE).toBe("expanded");
  });

  it("parses current and legacy compact values", () => {
    expect(parseSessionViewMode("expanded")).toBe("expanded");
    expect(parseSessionViewMode("hidden")).toBe("hidden");
    expect(parseSessionViewMode("fullscreen")).toBe("fullscreen");
    expect(parseSessionViewMode("compact")).toBe("expanded");
    expect(parseSessionViewMode("nope")).toBeNull();
    expect(isSessionViewMode("compact")).toBe(false);
  });
});

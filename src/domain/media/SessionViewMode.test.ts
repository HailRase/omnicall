import { describe, expect, it } from "vitest";
import { resolveNextSessionViewMode } from "./SessionViewMode.js";

describe("resolveNextSessionViewMode", () => {
  it("cycles compact → expanded → fullscreen → compact", () => {
    expect(resolveNextSessionViewMode("compact")).toBe("expanded");
    expect(resolveNextSessionViewMode("expanded")).toBe("fullscreen");
    expect(resolveNextSessionViewMode("fullscreen")).toBe("compact");
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { applyPreviewCardRect } from "./applyPreviewCardRect.js";

describe("applyPreviewCardRect", () => {
  it("writes preview pixel geometry using the provided scale", () => {
    const element = document.createElement("div");
    applyPreviewCardRect(
      element,
      { x: 180, y: 140, width: 1100, height: 800 },
      4,
    );
    expect(element.style.left).toBe("45px");
    expect(element.style.top).toBe("35px");
    expect(element.style.width).toBe("275px");
    expect(element.style.height).toBe("200px");
  });
});

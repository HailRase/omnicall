// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { notificationLevelToToastTone } from "./notificationLevelToToastTone.js";

describe("notificationLevelToToastTone", () => {
  it("maps notification levels to toast tones", () => {
    expect(notificationLevelToToastTone("info")).toBe("info");
    expect(notificationLevelToToastTone("success")).toBe("success");
    expect(notificationLevelToToastTone("warning")).toBe("warning");
    expect(notificationLevelToToastTone("error")).toBe("destructive");
  });
});

import { describe, expect, it } from "vitest";
import { formatAutoAnswerCountdownLabel } from "./formatAutoAnswerCountdownLabel.js";

describe("formatAutoAnswerCountdownLabel", () => {
  it("formats countdown including zero", () => {
    expect(formatAutoAnswerCountdownLabel(5)).toBe("Автоответ через 5");
    expect(formatAutoAnswerCountdownLabel(0)).toBe("Автоответ через 0");
  });
});

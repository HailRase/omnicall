import { describe, expect, it } from "vitest";
import { parseShellWindowLayoutPayload } from "./ShellWindowLayoutContract.js";

describe("parseShellWindowLayoutPayload", () => {
  it("accepts valid payload", () => {
    expect(
      parseShellWindowLayoutPayload({
        mode: "settings",
        animationDurationMs: 280,
        reducedMotion: false,
      }),
    ).toEqual({
      mode: "settings",
      animationDurationMs: 280,
      reducedMotion: false,
    });
  });

  it("rejects invalid mode", () => {
    expect(
      parseShellWindowLayoutPayload({
        mode: "fullscreen",
        animationDurationMs: 280,
        reducedMotion: false,
      }),
    ).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(parseShellWindowLayoutPayload(null)).toBeNull();
  });
});

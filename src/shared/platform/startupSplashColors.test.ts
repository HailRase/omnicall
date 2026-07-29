import { describe, expect, it } from "vitest";
import {
  BOOTSTRAP_SPLASH_BOUNCE_MS,
  BOOTSTRAP_SPLASH_MIN_VISIBLE_MS,
  BRAND_SPLASH_FROM,
  BRAND_SPLASH_MID,
  BRAND_SPLASH_TO,
  resolveBootstrapSplashAnimationDelayMs,
} from "./startupSplashColors.js";

describe("startupSplashColors", () => {
  it("keeps splash brand stops on the product cyan mark", () => {
    expect(BRAND_SPLASH_FROM).toBe("#6BC4FF");
    expect(BRAND_SPLASH_MID).toBe("#42AAFF");
    expect(BRAND_SPLASH_TO).toBe("#2A8FD9");
  });

  it("keeps bounce period and min visible dwell as positive product timings", () => {
    expect(BOOTSTRAP_SPLASH_BOUNCE_MS).toBe(1000);
    expect(BOOTSTRAP_SPLASH_MIN_VISIBLE_MS).toBe(4000);
    expect(BOOTSTRAP_SPLASH_MIN_VISIBLE_MS).toBeGreaterThanOrEqual(BOOTSTRAP_SPLASH_BOUNCE_MS);
  });

  it("returns a negative delay within one bounce period", () => {
    expect(resolveBootstrapSplashAnimationDelayMs(0)).toBe(0);
    expect(resolveBootstrapSplashAnimationDelayMs(300)).toBe(-300);
    expect(resolveBootstrapSplashAnimationDelayMs(BOOTSTRAP_SPLASH_BOUNCE_MS)).toBe(0);
    expect(resolveBootstrapSplashAnimationDelayMs(BOOTSTRAP_SPLASH_BOUNCE_MS + 150)).toBe(-150);
  });
});

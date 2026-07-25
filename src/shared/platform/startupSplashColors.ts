/**
 * Startup splash / BrowserWindow background + brand ball colors.
 *
 * Single-stage splash: `#boot-splash` is the only loading UI (React drives it via
 * `bootSplashDom`). Keep hex in sync with:
 * - `--color-brand-splash-*` in `src/renderer/styles/tokens.css`
 * - inline styles in `src/renderer/index.html`
 *
 * Full contract: `docs/softphone/Bootstrap-Splash-Contract.md`
 */

/** Window / pre-React page background (light). */
export const STARTUP_SPLASH_BG_LIGHT = "#f3f6fb";
/** Window / pre-React page background (dark). */
export const STARTUP_SPLASH_BG_DARK = "#111722";

/** Splash cyan highlight. */
export const BRAND_SPLASH_FROM = "#6BC4FF";
/** Primary splash mark color (product request). */
export const BRAND_SPLASH_MID = "#42AAFF";
/** Splash cyan depth stop. */
export const BRAND_SPLASH_TO = "#2A8FD9";

/** Bounce loop length (ms) for `#boot-splash` CSS. */
export const BOOTSTRAP_SPLASH_BOUNCE_MS = 1200;

/**
 * Negative CSS animation-delay helper (Storybook / optional React ball demos).
 * Production loading uses a single HTML splash, so phase sync is unused there.
 */
export function resolveBootstrapSplashAnimationDelayMs(
  nowMs: number = typeof performance !== "undefined" ? performance.now() : 0,
): number {
  const period = BOOTSTRAP_SPLASH_BOUNCE_MS;
  if (period <= 0) {
    return 0;
  }
  const phase = nowMs % period;
  return phase === 0 ? 0 : -phase;
}

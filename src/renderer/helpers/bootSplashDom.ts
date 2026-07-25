/**
 * Imperative control of the single-stage `#boot-splash` in index.html.
 * React must not mount a second loading splash; it only drives this DOM.
 *
 * Contract: `docs/softphone/Bootstrap-Splash-Contract.md`
 */

/** Fade-out duration — keep in sync with `#boot-splash` CSS transition. */
export const BOOT_SPLASH_EXIT_MS = 420;

/** Ball/shadow ease-to-rest after bounce — keep in sync with CSS comments. */
export const BOOT_SPLASH_SETTLE_MS = 420;

const REST_BALL_TRANSFORM = "translateY(0) scaleX(1.05) scaleY(0.95)";
const REST_SHADOW_TRANSFORM = "scaleX(1.08)";
const REST_SHADOW_OPACITY = "0.78";

function getBootSplash(): HTMLElement | null {
  return document.getElementById("boot-splash");
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Freeze a running bounce at the current computed transform, then ease to rest.
 * Replacing `@keyframes` mid-flight would teleport the ball from apex to ground.
 */
export function settleSplashBallMotion(
  ball: HTMLElement | null,
  shadow: HTMLElement | null,
): void {
  const reduced = prefersReducedMotion();
  const settleMs = reduced ? 0 : BOOT_SPLASH_SETTLE_MS;

  if (ball !== null) {
    const current = reduced ? REST_BALL_TRANSFORM : getComputedStyle(ball).transform;
    ball.style.animation = "none";
    ball.style.transition = "none";
    ball.style.transform = current === "none" ? REST_BALL_TRANSFORM : current;
    if (!reduced) {
      void ball.offsetWidth;
      ball.style.transition = `transform ${String(settleMs)}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    }
    ball.style.transform = REST_BALL_TRANSFORM;
  }

  if (shadow !== null) {
    const currentTransform = reduced
      ? REST_SHADOW_TRANSFORM
      : getComputedStyle(shadow).transform;
    const currentOpacity = reduced
      ? REST_SHADOW_OPACITY
      : getComputedStyle(shadow).opacity;
    shadow.style.animation = "none";
    shadow.style.transition = "none";
    shadow.style.transform =
      currentTransform === "none" ? REST_SHADOW_TRANSFORM : currentTransform;
    shadow.style.opacity = currentOpacity;
    if (!reduced) {
      void shadow.offsetWidth;
      shadow.style.transition = [
        `transform ${String(settleMs)}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        `opacity ${String(settleMs)}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      ].join(", ");
    }
    shadow.style.transform = REST_SHADOW_TRANSFORM;
    shadow.style.opacity = REST_SHADOW_OPACITY;
  }
}

function markBootSplashSettled(root: HTMLElement): void {
  if (root.dataset.settled === "true") {
    return;
  }
  settleSplashBallMotion(
    root.querySelector<HTMLElement>(".boot-ball"),
    root.querySelector<HTMLElement>(".boot-shadow"),
  );
  root.dataset.settled = "true";
}

/** Updates the determinate progress fill (0–100). Switches off indeterminate mode. */
export function updateBootSplashProgress(percent: number): void {
  const root = getBootSplash();
  const indicator = document.getElementById("boot-splash-indicator");
  if (root === null || indicator === null) {
    return;
  }

  const clamped = clampPercent(percent);
  root.dataset.progressMode = "determinate";
  const nextTransform =
    clamped >= 100 ? "translateX(0%)" : `translateX(-${100 - clamped}%)`;
  if (indicator.style.transform !== nextTransform) {
    indicator.style.transform = nextTransform;
  }

  if (clamped >= 100) {
    markBootSplashSettled(root);
  } else {
    delete root.dataset.settled;
  }
}

/** Syncs the loading line with React i18n (`bootstrap.loading`). */
export function setBootSplashMessage(message: string): void {
  const node = document.getElementById("boot-splash-message");
  if (node === null) {
    return;
  }
  node.textContent = message;
}

/** Forces the bounce into the settled landing pose (also implied by progress 100). */
export function settleBootSplash(): void {
  updateBootSplashProgress(100);
}

/**
 * Starts the exit fade. Resolves when the transition finishes (or immediately
 * when the node is missing / reduced-motion). Does not remove the node — call
 * `dismissBootSplash` after await so the ready shell can paint underneath.
 */
export function beginBootSplashExit(): Promise<void> {
  const root = getBootSplash();
  if (root === null) {
    return Promise.resolve();
  }

  if (prefersReducedMotion()) {
    return Promise.resolve();
  }

  if (root.dataset.exiting === "true") {
    return waitForBootSplashExit(root);
  }

  // Force style flush so the opacity transition always runs from 1 → 0.
  void root.offsetWidth;
  root.dataset.exiting = "true";
  return waitForBootSplashExit(root);
}

function waitForBootSplashExit(root: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      root.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(fallbackId);
      resolve();
    };

    const onTransitionEnd = (event: TransitionEvent): void => {
      if (event.target === root && event.propertyName === "opacity") {
        finish();
      }
    };

    root.addEventListener("transitionend", onTransitionEnd);
    const fallbackId = window.setTimeout(finish, BOOT_SPLASH_EXIT_MS + 80);
  });
}

/** Removes `#boot-splash` (call after exit animation, or immediately on error). */
export function dismissBootSplash(): void {
  getBootSplash()?.remove();
}

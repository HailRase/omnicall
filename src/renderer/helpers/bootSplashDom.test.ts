// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOOT_SPLASH_EXIT_MS,
  beginBootSplashExit,
  dismissBootSplash,
  setBootSplashMessage,
  settleBootSplash,
  updateBootSplashProgress,
} from "./bootSplashDom.js";

function mountBootSplash(): void {
  document.body.innerHTML = `
    <div id="boot-splash">
      <div class="boot-ball-stage">
        <div class="boot-ball"></div>
        <div class="boot-shadow"></div>
      </div>
      <p id="boot-splash-message">Loading…</p>
      <div class="boot-track">
        <div id="boot-splash-indicator" class="boot-indicator"></div>
      </div>
    </div>
  `;
}

describe("bootSplashDom", () => {
  beforeEach(() => {
    mountBootSplash();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("switches to determinate progress and sets indicator transform", () => {
    updateBootSplashProgress(42);

    const root = document.getElementById("boot-splash");
    const indicator = document.getElementById("boot-splash-indicator");
    expect(root?.dataset['progressMode']).toBe("determinate");
    expect(indicator?.style.transform).toBe("translateX(-58%)");
    expect(root?.dataset['settled']).toBeUndefined();
  });

  it("marks settled at 100% and freezes bounce without keyframe swap", () => {
    const ball = document.querySelector<HTMLElement>(".boot-ball");
    expect(ball).not.toBeNull();
    if (ball !== null) {
      ball.style.transform = "translateY(-3.55rem) scaleX(0.94) scaleY(1.06)";
    }

    updateBootSplashProgress(100);

    expect(document.getElementById("boot-splash")?.dataset['settled']).toBe("true");
    expect(ball?.style.animation).toBe("none");
    expect(ball?.style.transform).toBe("translateY(0) scaleX(1.05) scaleY(0.95)");
  });

  it("updates the loading message", () => {
    setBootSplashMessage("Загрузка приложения…");
    expect(document.getElementById("boot-splash-message")?.textContent).toBe(
      "Загрузка приложения…",
    );
  });

  it("settleBootSplash forces 100% and settled", () => {
    settleBootSplash();
    expect(document.getElementById("boot-splash")?.dataset['settled']).toBe("true");
    expect(document.getElementById("boot-splash-indicator")?.style.transform).toBe(
      "translateX(0%)",
    );
  });

  it("beginBootSplashExit marks exiting and resolves after fallback timeout", async () => {
    vi.useFakeTimers();
    const exitPromise = beginBootSplashExit();

    expect(document.getElementById("boot-splash")?.dataset['exiting']).toBe("true");

    await vi.advanceTimersByTimeAsync(BOOT_SPLASH_EXIT_MS + 80);
    await exitPromise;

    expect(document.getElementById("boot-splash")).not.toBeNull();
  });

  it("dismissBootSplash removes the node", () => {
    dismissBootSplash();
    expect(document.getElementById("boot-splash")).toBeNull();
  });
});

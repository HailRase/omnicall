import { describe, expect, it, vi } from "vitest";
import { attachExternalApplicationCloseInterceptor } from "./attachExternalApplicationCloseInterceptor.js";

type CloseHandler = (event: { preventDefault: () => void }) => void;

function createMockWindow(): {
  window: Electron.BrowserWindow;
  emitClose: () => { preventDefault: ReturnType<typeof vi.fn> };
  close: ReturnType<typeof vi.fn>;
} {
  let closeHandler: CloseHandler | null = null;
  const close = vi.fn();
  const isDestroyed = vi.fn(() => false);
  const on = vi.fn((event: string, handler: CloseHandler) => {
    if (event === "close") {
      closeHandler = handler;
    }
    return windowRef;
  });
  const removeListener = vi.fn((event: string, handler: CloseHandler) => {
    if (event === "close" && closeHandler === handler) {
      closeHandler = null;
    }
    return windowRef;
  });

  const windowRef = {
    on,
    removeListener,
    close,
    isDestroyed,
  };

  return {
    window: windowRef as unknown as Electron.BrowserWindow,
    close,
    emitClose: () => {
      const preventDefault = vi.fn();
      if (closeHandler === null) {
        throw new Error("close handler was not attached");
      }
      closeHandler({ preventDefault });
      return { preventDefault };
    },
  };
}

describe("attachExternalApplicationCloseInterceptor", () => {
  it("closes after an allowing guest guard", async () => {
    const { window, emitClose, close } = createMockWindow();
    const queryGuard = vi.fn(() => Promise.resolve(true));
    attachExternalApplicationCloseInterceptor({
      browserWindow: window,
      queryGuard,
    });

    const { preventDefault } = emitClose();
    expect(preventDefault).toHaveBeenCalledTimes(1);

    await vi.waitFor(() => {
      expect(close).toHaveBeenCalledTimes(1);
    });
    expect(queryGuard).toHaveBeenCalledTimes(1);
  });

  it("keeps the window open when the guest guard denies", async () => {
    const { window, emitClose, close } = createMockWindow();
    const onDenied = vi.fn();
    attachExternalApplicationCloseInterceptor({
      browserWindow: window,
      queryGuard: () => Promise.resolve(false),
      onDenied,
    });

    emitClose();
    await vi.waitFor(() => {
      expect(onDenied).toHaveBeenCalledTimes(1);
    });
    expect(close).not.toHaveBeenCalled();
  });

  it("skips the guest guard after markForceClose", () => {
    const { window, emitClose, close } = createMockWindow();
    const queryGuard = vi.fn(() => Promise.resolve(false));
    const interceptor = attachExternalApplicationCloseInterceptor({
      browserWindow: window,
      queryGuard,
    });

    interceptor.markForceClose();
    const { preventDefault } = emitClose();

    expect(preventDefault).not.toHaveBeenCalled();
    expect(queryGuard).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it("ignores duplicate close while a guard is in flight", async () => {
    const { window, emitClose, close } = createMockWindow();
    let releaseGuard!: (allow: boolean) => void;
    const queryGuard = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          releaseGuard = resolve;
        }),
    );
    attachExternalApplicationCloseInterceptor({
      browserWindow: window,
      queryGuard,
    });

    emitClose();
    emitClose();
    expect(queryGuard).toHaveBeenCalledTimes(1);

    releaseGuard(true);
    await vi.waitFor(() => {
      expect(close).toHaveBeenCalledTimes(1);
    });
  });
});

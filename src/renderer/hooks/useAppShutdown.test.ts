// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { AppShutdownPayload } from "@shared/ipc/AppShutdownContract.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { ok, err } from "@shared/result/index.js";
import { useAppShutdown } from "./useAppShutdown.js";

const acknowledgeShutdown = vi.fn();
const cancelShutdown = vi.fn();
let beforeCloseHandler: ((payload: AppShutdownPayload) => void) | null = null;

vi.mock("@adapters/platform/PreloadAppLifecycleGateway.js", () => ({
  PreloadAppLifecycleGateway: vi.fn().mockImplementation(() => ({
    onBeforeClose: (handler: (payload: AppShutdownPayload) => void) => {
      beforeCloseHandler = handler;
      return () => {
        beforeCloseHandler = null;
      };
    },
    acknowledgeShutdown,
    cancelShutdown,
  })),
}));

describe("useAppShutdown", () => {
  const execute = vi.fn();
  const facade = {
    shutdownCleanup: { execute },
  } as unknown as AccountBootstrapFacade;

  beforeEach(() => {
    vi.clearAllMocks();
    beforeCloseHandler = null;
    acknowledgeShutdown.mockResolvedValue({ ok: true, reason: undefined });
    cancelShutdown.mockResolvedValue({ ok: true, reason: undefined });
    execute.mockResolvedValue(ok(undefined));
  });

  it("acknowledges quit shutdown after successful cleanup", async () => {
    const correlationId = createCorrelationId();
    const payload: AppShutdownPayload = {
      correlationId,
      source: "window-close",
      action: "quit",
    };

    renderHook(() => useAppShutdown({ facade }));

    expect(beforeCloseHandler).not.toBeNull();
    beforeCloseHandler?.(payload);

    await waitFor(() => {
      expect(execute).toHaveBeenCalledWith({
        source: "window-close",
        correlationId,
      });
    });

    await waitFor(() => {
      expect(acknowledgeShutdown).toHaveBeenCalledWith(correlationId, "quit", false);
    });
  });

  it("acknowledges restart shutdown after successful cleanup", async () => {
    const correlationId = createCorrelationId();
    const payload: AppShutdownPayload = {
      correlationId,
      source: "restart-button",
      action: "restart",
    };

    renderHook(() => useAppShutdown({ facade }));
    beforeCloseHandler?.(payload);

    await waitFor(() => {
      expect(acknowledgeShutdown).toHaveBeenCalledWith(correlationId, "restart", false);
    });
  });

  it("surfaces shutdown error and sends cancel when cleanup fails", async () => {
    execute.mockResolvedValue(err({ code: "operation_failed", message: "failed" }));
    const correlationId = createCorrelationId();

    const { result } = renderHook(() => useAppShutdown({ facade }));
    beforeCloseHandler?.({
      correlationId,
      source: "before-quit",
      action: "quit",
    });

    await waitFor(() => {
      expect(result.current.shutdownErrorKey).toBe("shell.shutdown.failed");
      expect(result.current.isShuttingDown).toBe(false);
    });

    expect(acknowledgeShutdown).not.toHaveBeenCalled();
    expect(cancelShutdown).toHaveBeenCalledWith(correlationId, "quit", "cleanup_failed");
  });

  it("acknowledges shutdown when facade is null and cleanup can be skipped", async () => {
    const correlationId = createCorrelationId();
    renderHook(() => useAppShutdown({ facade: null }));
    beforeCloseHandler?.({
      correlationId,
      source: "before-quit",
      action: "quit",
    });

    await waitFor(() => {
      expect(acknowledgeShutdown).toHaveBeenCalledWith(correlationId, "quit", true);
    });
    expect(execute).not.toHaveBeenCalled();
    expect(cancelShutdown).not.toHaveBeenCalled();
  });

  it("supports retry flow after cleanup failure", async () => {
    const firstCorrelationId = createCorrelationId();
    const secondCorrelationId = createCorrelationId();
    execute.mockResolvedValueOnce(err({ code: "operation_failed", message: "failed" }));
    execute.mockResolvedValueOnce(ok(undefined));

    renderHook(() => useAppShutdown({ facade }));
    beforeCloseHandler?.({
      correlationId: firstCorrelationId,
      source: "window-close",
      action: "quit",
    });

    await waitFor(() => {
      expect(cancelShutdown).toHaveBeenCalledWith(firstCorrelationId, "quit", "cleanup_failed");
    });

    beforeCloseHandler?.({
      correlationId: secondCorrelationId,
      source: "window-close",
      action: "quit",
    });

    await waitFor(() => {
      expect(acknowledgeShutdown).toHaveBeenCalledWith(secondCorrelationId, "quit", false);
    });
  });
});

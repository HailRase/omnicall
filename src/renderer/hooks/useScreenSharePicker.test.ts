// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { useScreenSharePicker } from "./useScreenSharePicker.js";

const listDisplaySources = vi.fn();
const setPendingDisplaySource = vi.fn();
const switchLocalVideoSourceById = vi.fn();

beforeEach(() => {
  listDisplaySources.mockReset();
  setPendingDisplaySource.mockReset();
  switchLocalVideoSourceById.mockReset();
  Object.defineProperty(window, "softphone", {
    configurable: true,
    value: {
      listDisplaySources,
      setPendingDisplaySource,
    },
  });
});

describe("useScreenSharePicker", () => {
  it("loads sources on open and starts share only after confirm", async () => {
    listDisplaySources.mockResolvedValue({
      ok: true,
      sources: [
        {
          id: "screen:0:0",
          name: "Screen",
          kind: "screen",
          thumbnailDataUrl: null,
          appIconDataUrl: null,
        },
        {
          id: "window:1:0",
          name: "App",
          kind: "window",
          thumbnailDataUrl: null,
          appIconDataUrl: null,
        },
      ],
    });
    setPendingDisplaySource.mockResolvedValue({ ok: true });
    switchLocalVideoSourceById.mockResolvedValue({ ok: true, value: undefined });

    const facade = {
      switchLocalVideoSourceById,
    } as unknown as AccountBootstrapFacade;

    const { result } = renderHook(() => useScreenSharePicker({ facade }));

    act(() => {
      result.current.openPicker("call-1");
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.selectedSourceId).toBe("screen:0:0");
    });

    act(() => {
      result.current.setActiveKind("window");
    });
    expect(result.current.selectedSourceId).toBe("window:1:0");

    await act(async () => {
      result.current.confirm();
    });

    await waitFor(() => {
      expect(setPendingDisplaySource).toHaveBeenCalledWith({ sourceId: "window:1:0" });
      expect(switchLocalVideoSourceById).toHaveBeenCalledWith("call-1", "screen", false);
      expect(result.current.open).toBe(false);
    });
  });

  it("cancel clears pending source without switching video source", async () => {
    listDisplaySources.mockResolvedValue({ ok: true, sources: [] });
    setPendingDisplaySource.mockResolvedValue({ ok: true });
    const facade = {
      switchLocalVideoSourceById,
    } as unknown as AccountBootstrapFacade;

    const { result } = renderHook(() => useScreenSharePicker({ facade }));

    act(() => {
      result.current.openPicker("call-2");
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.cancel();
    });

    expect(setPendingDisplaySource).toHaveBeenCalledWith({ sourceId: null });
    expect(switchLocalVideoSourceById).not.toHaveBeenCalled();
    expect(result.current.open).toBe(false);
  });
});

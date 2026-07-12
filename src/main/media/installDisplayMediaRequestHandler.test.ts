import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSources, fromFrame } = vi.hoisted(() => ({
  getSources: vi.fn(() =>
    Promise.resolve([
      { id: "screen:0:0", name: "Entire Screen" },
      { id: "window:1:0", name: "App" },
    ]),
  ),
  fromFrame: vi.fn(),
}));

vi.mock("electron", () => ({
  desktopCapturer: { getSources },
  webContents: { fromFrame },
}));

import {
  clearPendingDisplaySourceId,
  setPendingDisplaySourceId,
} from "./pendingDisplaySourceStore.js";
import { installDisplayMediaRequestHandler } from "./installDisplayMediaRequestHandler.js";

describe("installDisplayMediaRequestHandler", () => {
  beforeEach(() => {
    getSources.mockClear();
    fromFrame.mockReset();
    clearPendingDisplaySourceId(42);
  });

  it("registers handler that grants only the pending source for webContents", async () => {
    const setDisplayMediaRequestHandler = vi.fn();
    const session = { setDisplayMediaRequestHandler };
    fromFrame.mockReturnValue({ id: 42 });
    setPendingDisplaySourceId(42, "window:1:0");

    installDisplayMediaRequestHandler({
      session: session as never,
    });

    expect(setDisplayMediaRequestHandler).toHaveBeenCalledTimes(1);
    const handler = setDisplayMediaRequestHandler.mock.calls[0]?.[0] as (
      request: Readonly<{ frame?: unknown }>,
      callback: (streams: Readonly<{ video?: unknown }>) => void,
    ) => void;

    const callback = vi.fn();
    handler({ frame: {} }, callback);

    await vi.waitFor(() => {
      expect(getSources).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith({
        video: { id: "window:1:0", name: "App" },
      });
    });

    expect(setDisplayMediaRequestHandler.mock.calls[0]?.[1]).toEqual({
      useSystemPicker: false,
    });
  });

  it("denies when no pending source is set", () => {
    const setDisplayMediaRequestHandler = vi.fn();
    const session = { setDisplayMediaRequestHandler };
    fromFrame.mockReturnValue({ id: 42 });

    installDisplayMediaRequestHandler({
      session: session as never,
    });

    const handler = setDisplayMediaRequestHandler.mock.calls[0]?.[0] as (
      request: Readonly<{ frame?: unknown }>,
      callback: (streams: Readonly<{ video?: unknown }>) => void,
    ) => void;

    const callback = vi.fn();
    handler({ frame: {} }, callback);

    expect(callback).toHaveBeenCalledWith({});
    expect(getSources).not.toHaveBeenCalled();
  });

  it("denies when webContents cannot be resolved from frame", () => {
    const setDisplayMediaRequestHandler = vi.fn();
    const session = { setDisplayMediaRequestHandler };
    fromFrame.mockReturnValue(null);

    installDisplayMediaRequestHandler({
      session: session as never,
    });

    const handler = setDisplayMediaRequestHandler.mock.calls[0]?.[0] as (
      request: Readonly<{ frame?: unknown }>,
      callback: (streams: Readonly<{ video?: unknown }>) => void,
    ) => void;

    const callback = vi.fn();
    handler({ frame: {} }, callback);

    expect(callback).toHaveBeenCalledWith({});
    expect(getSources).not.toHaveBeenCalled();
  });
});

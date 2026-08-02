import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type IpcHandler = (
  event: Readonly<{ sender: Readonly<{ id: number }> }>,
  payload: unknown,
) => unknown;

const { handlers, ipcMainHandle, ipcMainRemoveHandler } = vi.hoisted(() => ({
  handlers: new Map<string, IpcHandler>(),
  ipcMainHandle: vi.fn(),
  ipcMainRemoveHandler: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: {
    handle: ipcMainHandle,
    removeHandler: ipcMainRemoveHandler,
  },
}));

import { registerSdkNativeWindowIpc } from "./createSdkGatewayProductSurface.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";

function getHandler(channel: string): IpcHandler {
  const handler = handlers.get(channel);
  if (handler === undefined) {
    throw new Error(`Missing IPC handler: ${channel}`);
  }
  return handler;
}

describe("registerSdkNativeWindowIpc", () => {
  beforeEach(() => {
    handlers.clear();
    ipcMainHandle.mockReset();
    ipcMainRemoveHandler.mockReset();
    ipcMainHandle.mockImplementation((channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    });
  });

  afterEach(() => {
    ipcMainRemoveHandler(IPC_CHANNELS.sdkNativeWindow);
  });

  it("rejects an auxiliary sender before it reaches native window handling", () => {
    registerSdkNativeWindowIpc({
      getMainWindow: () => ({
        isDestroyed: () => false,
        webContents: { id: 303 },
      }),
    });
    const handler = getHandler(IPC_CHANNELS.sdkNativeWindow);

    expect(handler({ sender: { id: 404 } }, { op: "show" })).toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(handler({ sender: { id: 303 } }, { op: "show" })).toEqual({
      ok: false,
      code: "not_ready",
    });
  });
});

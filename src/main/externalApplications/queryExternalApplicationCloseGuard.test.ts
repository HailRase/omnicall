import { beforeEach, describe, expect, it, vi } from "vitest";

const { ipcMainOn, ipcMainRemoveListener, send } = vi.hoisted(() => ({
  ipcMainOn: vi.fn(),
  ipcMainRemoveListener: vi.fn(),
  send: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: {
    on: ipcMainOn,
    removeListener: ipcMainRemoveListener,
  },
}));

import { queryExternalApplicationCloseGuard } from "./queryExternalApplicationCloseGuard.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";

describe("queryExternalApplicationCloseGuard", () => {
  beforeEach(() => {
    ipcMainOn.mockReset();
    ipcMainRemoveListener.mockReset();
    send.mockReset();
  });

  it("returns the guest allow result from the matching sender", async () => {
    const webContents = {
      isDestroyed: () => false,
      send,
    };
    let resultHandler:
      | ((event: { sender: unknown }, value: unknown) => void)
      | undefined;
    ipcMainOn.mockImplementation((_channel: string, handler: typeof resultHandler) => {
      resultHandler = handler;
    });

    const resultPromise = queryExternalApplicationCloseGuard({
      webContents: webContents as never,
      createRequestId: () => "req-42",
      timeoutMs: 1_000,
    });

    expect(send).toHaveBeenCalledWith(
      IPC_CHANNELS.externalApplicationsCloseGuardQuery,
      { requestId: "req-42" },
    );
    resultHandler?.({ sender: webContents }, { requestId: "req-42", allow: true });
    await expect(resultPromise).resolves.toBe(true);
    expect(ipcMainRemoveListener).toHaveBeenCalled();
  });

  it("fails closed when the guest does not answer before timeout", async () => {
    const webContents = {
      isDestroyed: () => false,
      send,
    };
    ipcMainOn.mockImplementation(() => undefined);

    await expect(
      queryExternalApplicationCloseGuard({
        webContents: webContents as never,
        createRequestId: () => "req-timeout",
        timeoutMs: 20,
      }),
    ).resolves.toBe(false);
  });

  it("allows close when webContents is already destroyed", async () => {
    await expect(
      queryExternalApplicationCloseGuard({
        webContents: {
          isDestroyed: () => true,
          send,
        } as never,
      }),
    ).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
  });
});

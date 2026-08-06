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

import {
  registerSdkBrokerIpc,
  resetSdkBrokerRegistrationForTests,
} from "./registerSdkBrokerIpc.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";

const targetSender = { id: 101 };
const auxiliarySender = { id: 202 };

function getHandler(channel: string): IpcHandler {
  const handler = handlers.get(channel);
  if (handler === undefined) {
    throw new Error(`Missing IPC handler: ${channel}`);
  }
  return handler;
}

function getBrokerRequestId(value: unknown): string {
  if (
    typeof value !== "object" ||
    value === null ||
    !("brokerRequestId" in value)
  ) {
    throw new Error("Missing broker request payload");
  }
  const brokerRequestId = value["brokerRequestId"];
  if (typeof brokerRequestId !== "string") {
    throw new Error("Missing broker request id");
  }
  return brokerRequestId;
}

describe("registerSdkBrokerIpc", () => {
  beforeEach(() => {
    handlers.clear();
    ipcMainHandle.mockReset();
    ipcMainRemoveHandler.mockReset();
    ipcMainHandle.mockImplementation((channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    });
  });

  afterEach(() => {
    resetSdkBrokerRegistrationForTests();
  });

  it("rejects auxiliary senders while retaining the configured renderer", async () => {
    const send = vi.fn();
    const mainWebContents = {
      id: targetSender.id,
      isDestroyed: () => false,
      send,
      on: vi.fn(),
      once: vi.fn(),
    };
    const broker = registerSdkBrokerIpc({
      getMainWindow: () => ({
        isDestroyed: () => false,
        webContents: mainWebContents,
      }),
    });
    const setReady = getHandler(IPC_CHANNELS.sdkBrokerSetReady);
    const reply = getHandler(IPC_CHANNELS.sdkBrokerReply);

    expect(setReady({ sender: auxiliarySender }, { ready: true })).toEqual({
      ok: false,
    });
    expect(broker.isReady()).toBe(false);

    expect(setReady({ sender: mainWebContents }, { ready: true })).toEqual({
      ok: true,
    });
    expect(broker.isReady()).toBe(true);

    const pending = broker.request({
      protocolVersion: 1,
      kind: "command",
      type: "sdk:ping",
      requestId: "req_ipc_sender_001",
      serverInstanceId: "srv_ipc_sender",
      sessionEpoch: "epoch_ipc_sender",
      occurredAt: "2026-08-03T00:00:00.000Z",
      payload: { nonce: "nonce_ipc_sender" },
    });
    const request = send.mock.calls[0]?.[1];
    expect(request).toMatchObject({ brokerRequestId: expect.any(String) });
    const brokerRequestId = getBrokerRequestId(request);

    expect(
      reply(
        { sender: auxiliarySender },
        {
          brokerRequestId,
          ok: true,
          reply: {
            protocolVersion: 1,
            kind: "reply",
            ok: true,
            requestId: "req_ipc_sender_001",
            commandType: "sdk:ping",
            serverInstanceId: "srv_ipc_sender",
            sessionEpoch: "epoch_ipc_sender",
            occurredAt: "2026-08-03T00:00:00.001Z",
            revision: 1,
            result: { nonce: "nonce_ipc_sender" },
          },
        },
      ),
    ).toEqual({ ok: false });
    expect(broker.getPendingCount()).toBe(1);

    expect(
      reply(
        { sender: mainWebContents },
        {
          brokerRequestId,
          ok: false,
          code: "operation_failed",
        },
      ),
    ).toEqual({ ok: true });
    await expect(pending).resolves.toEqual({
      ok: false,
      code: "operation_failed",
    });
  });
});

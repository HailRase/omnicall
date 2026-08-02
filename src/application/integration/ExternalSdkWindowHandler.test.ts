/**
 * WU-02 — window commands via shared SdkSessionRevisionCoordinator.
 */

import { describe, expect, it, vi } from "vitest";
import type { SdkNativeWindowPort } from "@ports/integration/SdkNativeWindowPort.js";
import {
  createCallId,
  createOutgoingCall,
  createPhoneNumber,
  type Call,
} from "@domain/index.js";
import { ok } from "@shared/result/index.js";

import { ExternalSdkCallHandler } from "./ExternalSdkCallHandler.js";
import type { ExternalSdkCallPort } from "./ExternalSdkCallPort.js";
import { ExternalSdkWindowHandler } from "./ExternalSdkWindowHandler.js";
import { SdkCallOwnershipRegistry } from "./SdkCallOwnershipRegistry.js";
import { SdkSessionRevisionCoordinator } from "./SdkSessionRevisionCoordinator.js";

function windowCommand(
  type: "window:show" | "window:hide" | "window:get-state",
  payload: Record<string, unknown> = {},
): unknown {
  return {
    protocolVersion: 1,
    kind: "command",
    type,
    requestId: `req_${type.replace(":", "_")}`,
    serverInstanceId: "srv_test",
    sessionEpoch: "epoch_test",
    occurredAt: "2026-08-02T20:00:00.000Z",
    payload,
  };
}

function callOriginate(expectedRevision: number): unknown {
  return {
    protocolVersion: 1,
    kind: "command",
    type: "call:originate",
    requestId: `req_orig_${expectedRevision}`,
    serverInstanceId: "srv_test",
    sessionEpoch: "epoch_test",
    occurredAt: "2026-08-02T20:00:00.000Z",
    payload: { destination: "+15551234567", expectedRevision },
  };
}

function createWindowPort(
  overrides: Partial<SdkNativeWindowPort> = {},
): SdkNativeWindowPort {
  return {
    show: vi.fn(() => Promise.resolve({ ok: true as const, visible: true })),
    hide: vi.fn(() => Promise.resolve({ ok: true as const, visible: false })),
    getState: vi.fn(() => Promise.resolve({ ok: true as const, visible: true })),
    ...overrides,
  };
}

describe("ExternalSdkWindowHandler", () => {
  it("show advances revision to post-success value", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const port = createWindowPort();
    const handler = new ExternalSdkWindowHandler({
      windowPort: port,
      revisionCoordinator: coordinator,
    });

    const result = await handler.handleCommand(windowCommand("window:show"));
    expect(result).toEqual({
      ok: true,
      result: { visible: true },
      revision: 2,
    });
    expect(coordinator.peek()).toBe(2);
  });

  it("hide mismatch returns stale_state without native side effect", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const port = createWindowPort();
    const handler = new ExternalSdkWindowHandler({
      windowPort: port,
      revisionCoordinator: coordinator,
    });

    const result = await handler.handleCommand(
      windowCommand("window:hide", { expectedRevision: 99 }),
    );
    expect(result).toEqual({
      ok: false,
      code: "stale_state",
      retryable: false,
      currentRevision: 1,
    });
    expect(coordinator.peek()).toBe(1);
  });

  it("hide succeeds with expectedRevision and post-success revision", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const port = createWindowPort();
    const handler = new ExternalSdkWindowHandler({
      windowPort: port,
      revisionCoordinator: coordinator,
    });

    const result = await handler.handleCommand(
      windowCommand("window:hide", { expectedRevision: 1 }),
    );
    expect(result).toEqual({
      ok: true,
      result: { visible: false },
      revision: 2,
    });
  });

  it("active-call hide denial remains conflict (not stale_state)", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const port = createWindowPort({
      hide: vi.fn(() => Promise.resolve({
        ok: false as const,
        code: "conflict" as const,
      })),
    });
    const handler = new ExternalSdkWindowHandler({
      windowPort: port,
      revisionCoordinator: coordinator,
    });

    const result = await handler.handleCommand(
      windowCommand("window:hide", { expectedRevision: 1 }),
    );
    expect(result).toEqual({
      ok: false,
      code: "conflict",
      retryable: false,
    });
    expect(coordinator.peek()).toBe(1);
  });

  it("get-state is peek-only and does not advance", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    await coordinator.runSerializedMutation(() => Promise.resolve({
      ok: true,
      result: { seeded: true },
    }));
    expect(coordinator.peek()).toBe(2);

    const port = createWindowPort({
      getState: vi.fn(() => Promise.resolve({ ok: true as const, visible: false })),
    });
    const handler = new ExternalSdkWindowHandler({
      windowPort: port,
      revisionCoordinator: coordinator,
    });

    const result = await handler.handleCommand(windowCommand("window:get-state"));
    expect(result).toEqual({
      ok: true,
      result: { visible: false },
      revision: 2,
    });
    expect(coordinator.peek()).toBe(2);
  });

  it("interleaves window:show with call:originate on one monotonic clock", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const windowHandler = new ExternalSdkWindowHandler({
      windowPort: createWindowPort(),
      revisionCoordinator: coordinator,
    });
    const call: Call = createOutgoingCall(
      createCallId("call_1"),
      createPhoneNumber("+15551234567"),
    );
    const callPort: ExternalSdkCallPort = {
      makeCall: vi.fn(() => Promise.resolve(ok(call))),
      answerCall: vi.fn(() => Promise.resolve(ok(call))),
      rejectCall: vi.fn(() => Promise.resolve(ok(call))),
      hangupCall: vi.fn(() => Promise.resolve(ok(call))),
      holdCall: vi.fn(() => Promise.resolve(ok(call))),
      resumeCall: vi.fn(() => Promise.resolve(ok(call))),
      muteCall: vi.fn(() => Promise.resolve(ok(call))),
      unmuteCall: vi.fn(() => Promise.resolve(ok(call))),
      sendDtmf: vi.fn(() => Promise.resolve(ok(undefined))),
    };
    const callHandler = new ExternalSdkCallHandler({
      callPort,
      ownership: new SdkCallOwnershipRegistry(),
      revisionCoordinator: coordinator,
    });

    const show = await windowHandler.handleCommand(windowCommand("window:show"));
    expect(show).toMatchObject({ ok: true, revision: 2 });

    const originate = await callHandler.handleCommand(callOriginate(2), {
      clientId: "client_a",
    });
    expect(originate).toMatchObject({ ok: true, revision: 3 });

    const hide = await windowHandler.handleCommand(
      windowCommand("window:hide", { expectedRevision: 3 }),
    );
    expect(hide).toMatchObject({ ok: true, revision: 4 });
    expect(coordinator.peek()).toBe(4);
  });

  it("serializes concurrent show then hide without dual clocks", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    let releaseShow!: () => void;
    const showGate = new Promise<void>((resolve) => {
      releaseShow = resolve;
    });
    const port = createWindowPort({
      show: vi.fn(() => {
        return showGate.then(() => ({
          ok: true as const,
          visible: true,
        }));
      }),
    });
    const handler = new ExternalSdkWindowHandler({
      windowPort: port,
      revisionCoordinator: coordinator,
    });

    const showPromise = handler.handleCommand(windowCommand("window:show"));
    await Promise.resolve();
    const hidePromise = handler.handleCommand(
      windowCommand("window:hide", { expectedRevision: 1 }),
    );

    releaseShow();
    const [show, hide] = await Promise.all([showPromise, hidePromise]);
    expect(show).toMatchObject({ ok: true, revision: 2 });
    expect(hide).toMatchObject({
      ok: false,
      code: "stale_state",
      currentRevision: 2,
    });
    expect(coordinator.peek()).toBe(2);
  });
});

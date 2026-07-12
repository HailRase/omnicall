import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeadsetSyncQueue } from "./HeadsetSyncQueue.js";

describe("HeadsetSyncQueue mute locks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows a new mute begin after match even while echo is active", () => {
    const queue = new HeadsetSyncQueue();
    expect(queue.beginMuteSessionSync("c1", true)).toBe(true);
    queue.clearMuteSyncIfMatched("c1", true);

    expect(queue.getMuteIntent()).toBeNull();
    expect(queue.isHardwareMuteLocked()).toBe(true);
    expect(queue.beginMuteSessionSync("c1", false)).toBe(true);
  });

  it("does not drop mute intent when echo window elapses before match", () => {
    const queue = new HeadsetSyncQueue();
    expect(queue.beginMuteSessionSync("c1", true)).toBe(true);

    vi.setSystemTime(Date.now() + 400);
    expect(queue.getMuteIntent()).toBe(true);
    expect(queue.getBusyState().isBusy).toBe(true);
    expect(queue.beginMuteSessionSync("c1", false)).toBe(false);
  });

  it("keeps UI busy for settle window after a fast match", () => {
    const queue = new HeadsetSyncQueue();
    const onClear = vi.fn();
    queue.setUiBusyClearListener(onClear);

    expect(queue.beginMuteSessionSync("c1", true)).toBe(true);
    queue.clearMuteSyncIfMatched("c1", true);

    expect(queue.getBusyState()).toEqual({
      holdSessionId: null,
      muteSessionId: "c1",
      isBusy: true,
    });

    vi.advanceTimersByTime(260);
    expect(onClear).toHaveBeenCalled();
    expect(queue.getBusyState().isBusy).toBe(false);
  });

  it("unlocks hardware mute after short post-match echo", () => {
    const queue = new HeadsetSyncQueue();
    expect(queue.beginMuteSessionSync("c1", true)).toBe(true);
    queue.clearMuteSyncIfMatched("c1", true);

    vi.setSystemTime(Date.now() + 350);
    expect(queue.isHardwareMuteLocked()).toBe(false);
  });

  it("clears hold intent without arming mute echo", () => {
    const queue = new HeadsetSyncQueue();
    expect(queue.beginHoldSessionSync("c1", "hold")).toBe(true);
    queue.clearHoldSyncIfMatched("c1", true);

    expect(queue.getHoldIntent()).toBeNull();
    expect(queue.getBusyState().isBusy).toBe(false);
    expect(queue.isHardwareMuteLocked()).toBe(false);
    expect(queue.isHoldSyncGuardActive()).toBe(false);
  });

  it("armHardwareMuteEcho locks mute without UI busy", () => {
    const queue = new HeadsetSyncQueue();
    queue.armHardwareMuteEcho(600);

    expect(queue.isHardwareMuteLocked()).toBe(true);
    expect(queue.getBusyState().isBusy).toBe(false);

    vi.setSystemTime(Date.now() + 650);
    expect(queue.isHardwareMuteLocked()).toBe(false);
  });

  it("clears UI busy when mute intent times out unmatched", () => {
    const queue = new HeadsetSyncQueue();
    const onClear = vi.fn();
    queue.setUiBusyClearListener(onClear);

    expect(queue.beginMuteSessionSync("held-1", true)).toBe(true);
    expect(queue.getBusyState().isBusy).toBe(true);

    vi.advanceTimersByTime(2100);
    expect(queue.getMuteIntent()).toBeNull();
    expect(queue.getBusyState().isBusy).toBe(false);
    expect(onClear).toHaveBeenCalled();
  });

  it("echo swallows matching mute bit but allows opposite user override for latch", () => {
    const queue = new HeadsetSyncQueue();
    expect(queue.beginMuteSessionSync("c1", true)).toBe(true);
    queue.clearMuteSyncIfMatched("c1", true);

    expect(queue.shouldIgnoreHardwareMuteEvent(true, true, "latch")).toBe(true);
    expect(queue.shouldIgnoreHardwareMuteEvent(false, true, "latch")).toBe(false);

    expect(queue.beginMuteSessionSync("c1", false)).toBe(true);
    expect(queue.shouldIgnoreHardwareMuteEvent(false, true, "latch")).toBe(true);
  });

  it("pulse echo swallows opposite unmute bounce", () => {
    const queue = new HeadsetSyncQueue();
    expect(queue.beginMuteSessionSync("c1", true)).toBe(true);
    queue.clearMuteSyncIfMatched("c1", true);

    expect(queue.shouldIgnoreHardwareMuteEvent(false, true, "pulse")).toBe(true);
    expect(queue.shouldIgnoreHardwareMuteEvent(true, true, "pulse")).toBe(true);
  });

  it("latch swallowAll echo swallows opposite firmware bounce (Poly)", () => {
    const queue = new HeadsetSyncQueue();
    expect(queue.beginMuteSessionSync("c1", true)).toBe(true);
    queue.clearMuteSyncIfMatched("c1", true);

    expect(queue.shouldIgnoreHardwareMuteEvent(false, true, "latch", "swallowAll")).toBe(true);
    expect(queue.shouldIgnoreHardwareMuteEvent(true, true, "latch", "swallowAll")).toBe(true);
  });
});

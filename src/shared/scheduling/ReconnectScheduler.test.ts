import { afterEach, describe, expect, it, vi } from "vitest";
import { ReconnectScheduler } from "./ReconnectScheduler.js";

describe("ReconnectScheduler", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires scheduled callback once after delay", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const scheduler = new ReconnectScheduler();

    scheduler.schedule(1000, callback);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("cancel prevents scheduled callback from firing", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const scheduler = new ReconnectScheduler();

    const handle = scheduler.schedule(1000, callback);
    expect(handle).not.toBeNull();
    if (handle !== null) {
      scheduler.cancel(handle);
    }

    vi.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();
    expect(scheduler.getPendingCount()).toBe(0);
  });

  it("dispose clears all pending timers", () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();
    const scheduler = new ReconnectScheduler();

    scheduler.schedule(1000, first);
    scheduler.schedule(2000, second);
    expect(scheduler.getPendingCount()).toBe(2);

    scheduler.dispose();
    expect(scheduler.getPendingCount()).toBe(0);

    vi.advanceTimersByTime(5000);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it("does not schedule after dispose", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const scheduler = new ReconnectScheduler();

    scheduler.dispose();
    const handle = scheduler.schedule(1000, callback);
    expect(handle).toBeNull();

    vi.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();
  });
});

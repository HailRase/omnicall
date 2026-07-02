import { afterEach, describe, expect, it, vi } from "vitest";
import { awaitJsSipRegistration } from "./awaitJsSipRegistration.js";
import type { JsSipUaEventName, JsSipUaListener, JsSipUaPort } from "./JsSipUaPort.js";

class MockJsSipUa implements JsSipUaPort {
  private readonly listeners = new Map<JsSipUaEventName, Set<JsSipUaListener>>();
  private registered = false;
  registerCalls = 0;

  on(event: JsSipUaEventName, listener: JsSipUaListener): void {
    const bucket = this.listeners.get(event) ?? new Set<JsSipUaListener>();
    bucket.add(listener);
    this.listeners.set(event, bucket);
  }

  off(event: JsSipUaEventName, listener: JsSipUaListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: JsSipUaEventName, payload?: unknown): void {
    const bucket = this.listeners.get(event);
    if (bucket === undefined) {
      return;
    }
    for (const listener of bucket) {
      listener(payload);
    }
  }

  start(): void {
    return;
  }

  stop(): void {
    return;
  }

  register(): void {
    this.registerCalls += 1;
  }

  unregister(): void {
    return;
  }

  isRegistered(): boolean {
    return this.registered;
  }

  isConnected(): boolean {
    return true;
  }

  markRegistered(): void {
    this.registered = true;
  }

  call(): never {
    throw new Error("not implemented in mock");
  }
}

describe("awaitJsSipRegistration", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves ok on registered event", async () => {
    const mockUa = new MockJsSipUa();
    const registerPromise = awaitJsSipRegistration({
      ua: mockUa,
      username: "agent",
      registrationTimeoutMs: 5_000,
    });

    expect(mockUa.registerCalls).toBe(1);
    mockUa.markRegistered();
    mockUa.emit("registered");

    const result = await registerPromise;
    expect(result.ok).toBe(true);
  });

  it("ignores transient Connection Error until registered succeeds", async () => {
    const mockUa = new MockJsSipUa();
    const registerPromise = awaitJsSipRegistration({
      ua: mockUa,
      username: "agent",
      registrationTimeoutMs: 5_000,
    });

    mockUa.emit("registrationFailed", { cause: "Connection Error" });
    mockUa.emit("registrationFailed", { cause: "Connection Error" });
    mockUa.markRegistered();
    mockUa.emit("registered");

    const result = await registerPromise;
    expect(result.ok).toBe(true);
  });

  it("fails immediately on non-transient registration failure", async () => {
    const mockUa = new MockJsSipUa();
    const registerPromise = awaitJsSipRegistration({
      ua: mockUa,
      username: "agent",
      registrationTimeoutMs: 5_000,
    });

    mockUa.emit("registrationFailed", { cause: "Authentication Error" });

    const result = await registerPromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Authentication Error");
    }
  });

  it("maps 403 Rejected to forbidden in failure message", async () => {
    const mockUa = new MockJsSipUa();
    const registerPromise = awaitJsSipRegistration({
      ua: mockUa,
      username: "agent",
      registrationTimeoutMs: 5_000,
    });

    mockUa.emit("registrationFailed", {
      cause: "Rejected",
      response: { status_code: 403, reason_phrase: "Forbidden" },
    });

    const result = await registerPromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("403");
      expect(result.error.message).toContain("forbidden");
    }
  });

  it("times out when only transient failures are emitted", async () => {
    vi.useFakeTimers();
    const mockUa = new MockJsSipUa();
    const registerPromise = awaitJsSipRegistration({
      ua: mockUa,
      username: "agent",
      registrationTimeoutMs: 1_000,
    });

    mockUa.emit("registrationFailed", { cause: "Connection Error" });
    await vi.advanceTimersByTimeAsync(1_000);

    const result = await registerPromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("registration_timeout");
    }
  });
});

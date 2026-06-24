import { describe, expect, it, vi } from "vitest";
import {
  createCallId,
  createPhoneNumber,
  createSipAccount,
  createSipAccountId,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { JsSipTelephonyAdapter } from "./JsSipTelephonyAdapter.js";
import type { JsSipDisconnectEvent, JsSipUaEventName, JsSipUaListener, JsSipUaPort } from "./JsSipUaPort.js";

class MockJsSipUa implements JsSipUaPort {
  private readonly listeners = new Map<JsSipUaEventName, Set<JsSipUaListener>>();
  private registered = false;
  private connected = true;
  private registrationOutcome: "success" | "failure" | "hang" = "success";
  startCalls = 0;
  stopCalls = 0;
  registerCalls = 0;
  unregisterCalls = 0;

  setRegistrationOutcome(outcome: "success" | "failure" | "hang"): void {
    this.registrationOutcome = outcome;
  }

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
    this.startCalls += 1;
    this.connected = true;
  }

  stop(): void {
    this.stopCalls += 1;
    this.connected = false;
    this.registered = false;
  }

  register(): void {
    this.registerCalls += 1;
    if (this.registrationOutcome === "hang") {
      return;
    }
    queueMicrotask(() => {
      if (this.registrationOutcome === "failure") {
        const failureEvent = {
          cause: "Authentication Error",
        };
        this.emit("registrationFailed", failureEvent);
        return;
      }

      this.markRegistered();
      this.emit("registered");
    });
  }

  unregister(): void {
    this.unregisterCalls += 1;
    queueMicrotask(() => {
      this.registered = false;
      this.emit("unregistered");
    });
  }

  isRegistered(): boolean {
    return this.registered;
  }

  isConnected(): boolean {
    return this.connected;
  }

  markRegistered(): void {
    this.registered = true;
  }

  markDisconnected(event: JsSipDisconnectEvent): void {
    this.connected = false;
    this.emit("disconnected", event);
  }
}

describe("JsSipTelephonyAdapter", () => {
  const account = createSipAccount(createSipAccountId("agent"), {
    uri: "sip:agent@pbx.example",
    username: "agent",
    password: "secret",
    displayName: "Agent",
    registrar: "wss://pbx.example:7443",
  });

  function createAdapter(mockUa: MockJsSipUa): JsSipTelephonyAdapter {
    return new JsSipTelephonyAdapter({
      logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
      createUserAgent: () => mockUa,
    });
  }

  it("registers successfully when UA emits registered", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    const correlationId = createCorrelationId();

    const result = await adapter.register({ account, correlationId });
    expect(result.ok).toBe(true);
    expect(mockUa.startCalls).toBe(1);
    expect(mockUa.registerCalls).toBe(1);
  });

  it("maps registration failure from UA registrationFailed event", async () => {
    const mockUa = new MockJsSipUa();
    mockUa.setRegistrationOutcome("failure");
    const adapter = createAdapter(mockUa);
    const correlationId = createCorrelationId();

    const result = await adapter.register({ account, correlationId });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("operation_failed");
      expect(result.error.message).toContain("Authentication Error");
    }
    expect(mockUa.stopCalls).toBe(0);
  });

  it("ignores transport disconnect while registration is in flight", async () => {
    const mockUa = new MockJsSipUa();
    mockUa.setRegistrationOutcome("hang");
    const adapter = createAdapter(mockUa);
    const handler = vi.fn(() => Promise.resolve());
    adapter.setTransportDisconnectedHandler(handler);

    const registerPromise = adapter.register({
      account,
      correlationId: createCorrelationId(),
    });

    await Promise.resolve();

    mockUa.markDisconnected({
      error: true,
      code: 1006,
      reason: "websocket_closed",
    });

    expect(handler).not.toHaveBeenCalled();

    mockUa.emit("registrationFailed", { cause: "Connection Error" });

    const result = await registerPromise;
    expect(result.ok).toBe(false);
  });

  it("invokes transport disconnect handler on UA disconnected event", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    const handler = vi.fn(() => Promise.resolve());

    adapter.setTransportDisconnectedHandler(handler);

    await adapter.register({
      account,
      correlationId: createCorrelationId(),
    });

    mockUa.markDisconnected({
      error: true,
      code: 1006,
      reason: "websocket_closed",
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "websocket_closed" }),
    );
  });

  it("does not invoke transport disconnect handler during intentional unregister", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    const handler = vi.fn(() => Promise.resolve());
    adapter.setTransportDisconnectedHandler(handler);

    await adapter.register({
      account,
      correlationId: createCorrelationId(),
    });

    await adapter.unregister(createCorrelationId());

    expect(handler).not.toHaveBeenCalled();
  });

  it("returns not_implemented for deferred call operations", async () => {
    const adapter = createAdapter(new MockJsSipUa());
    const correlationId = createCorrelationId();

    const makeCallResult = await adapter.makeCall({
      callId: createCallId("call-1"),
      number: createPhoneNumber("100"),
      correlationId,
    });

    expect(makeCallResult.ok).toBe(false);
    if (!makeCallResult.ok) {
      expect(makeCallResult.error.code).toBe("not_implemented");
    }
  });

  it("does not log passwords during registration", async () => {
    const mockUa = new MockJsSipUa();
    const logger = createTestLogger({
      featureId: "F-001",
      boundedContext: "Telephony",
    });
    const adapter = new JsSipTelephonyAdapter({
      logger,
      createUserAgent: () => mockUa,
    });

    await adapter.register({
      account,
      correlationId: createCorrelationId(),
    });

    const serialized = JSON.stringify(logger.entries);
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain(account.password);
  });
});

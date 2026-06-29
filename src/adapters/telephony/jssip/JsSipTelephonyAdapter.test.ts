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
import type {
  JsSipDisconnectEvent,
  JsSipUaEventName,
  JsSipUaListener,
  JsSipUaPort,
} from "./JsSipUaPort.js";
import type {
  JsSipNewRtcSessionEvent,
  JsSipReferCommandOptions,
  JsSipRtcSessionEventName,
  JsSipRtcSessionListener,
  JsSipRtcSessionPort,
} from "./JsSipRtcSessionPort.js";

class MockJsSipRtcSession implements JsSipRtcSessionPort {
  private readonly listeners = new Map<
    JsSipRtcSessionEventName,
    Set<JsSipRtcSessionListener>
  >();
  readonly id: string;
  answerOptions: Readonly<Record<string, unknown>> | undefined;
  terminateOptions: Readonly<Record<string, unknown>> | undefined;
  answerCalls = 0;
  terminateCalls = 0;
  holdCalls = 0;
  unholdCalls = 0;
  holdAvailable = true;
  unholdAvailable = true;
  referAvailable = true;
  referScenario: "success" | "request_failed" | "notify_failed" | "unavailable" = "success";
  readonly sentDtmfTones: string[] = [];
  readonly referInvocations: Array<{
    target: string;
    options?: JsSipReferCommandOptions;
  }> = [];
  private localHold = false;
  private connection: unknown = null;
  private readonly remoteIdentityHeader: string;

  constructor(id: string, remoteIdentityHeader = '"Caller" <sip:100@pbx.example>') {
    this.id = id;
    this.remoteIdentityHeader = remoteIdentityHeader;
  }

  on(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    const bucket = this.listeners.get(event) ?? new Set<JsSipRtcSessionListener>();
    bucket.add(listener);
    this.listeners.set(event, bucket);
  }

  off(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: JsSipRtcSessionEventName, payload?: unknown): void {
    const bucket = this.listeners.get(event);
    if (bucket === undefined) {
      return;
    }
    for (const listener of bucket) {
      listener(payload);
    }
  }

  answer(options?: Readonly<Record<string, unknown>>): void {
    this.answerCalls += 1;
    this.answerOptions = options;
  }

  terminate(options?: Readonly<Record<string, unknown>>): void {
    this.terminateCalls += 1;
    this.terminateOptions = options;
    this.emit("ended");
  }

  hold(_options?: Readonly<Record<string, unknown>>, done?: () => void): boolean {
    if (!this.holdAvailable || this.localHold) {
      return false;
    }
    this.holdCalls += 1;
    this.localHold = true;
    if (done !== undefined) {
      queueMicrotask(() => {
        done();
      });
    }
    return true;
  }

  unhold(_options?: Readonly<Record<string, unknown>>, done?: () => void): boolean {
    if (!this.unholdAvailable || !this.localHold) {
      return false;
    }
    this.unholdCalls += 1;
    this.localHold = false;
    if (done !== undefined) {
      queueMicrotask(() => {
        done();
      });
    }
    return true;
  }

  getConnection(): unknown {
    return this.connection;
  }

  setConnection(connection: unknown): void {
    this.connection = connection;
  }

  getRemoteIdentityHeader(): string {
    return this.remoteIdentityHeader;
  }

  sendDtmf(tone: string): void {
    this.sentDtmfTones.push(tone);
  }

  refer(target: string, options?: JsSipReferCommandOptions): unknown {
    if (options !== undefined) {
      this.referInvocations.push({ target, options });
    } else {
      this.referInvocations.push({ target });
    }

    if (!this.referAvailable || this.referScenario === "unavailable") {
      return false;
    }

    const handlers = options?.eventHandlers;
    queueMicrotask(() => {
      if (this.referScenario === "request_failed") {
        handlers?.["requestFailed"]?.({ cause: "REJECTED" });
        return;
      }
      handlers?.["requestSucceeded"]?.({ response: { status_code: 202 } });
      if (this.referScenario === "notify_failed") {
        handlers?.["failed"]?.({ status_line: { status_code: 603, reason_phrase: "Decline" } });
        return;
      }
      handlers?.["accepted"]?.({ status_line: { status_code: 200, reason_phrase: "OK" } });
    });

    return { id: "refer-subscriber" };
  }
}

class MockJsSipUa implements JsSipUaPort {
  private readonly listeners = new Map<JsSipUaEventName, Set<JsSipUaListener>>();
  private registered = false;
  private connected = true;
  private registrationOutcome: "success" | "failure" | "hang" = "success";
  startCalls = 0;
  stopCalls = 0;
  registerCalls = 0;
  unregisterCalls = 0;
  readonly callInvocations: Array<{
    target: string;
    options?: Readonly<Record<string, unknown>>;
    session: MockJsSipRtcSession;
  }> = [];

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

  call(target: string, options?: Readonly<Record<string, unknown>>): JsSipRtcSessionPort {
    const session = new MockJsSipRtcSession(`session-${this.callInvocations.length}`);
    const invocation: {
      target: string;
      options?: Readonly<Record<string, unknown>>;
      session: MockJsSipRtcSession;
    } = { target, session };
    if (options !== undefined) {
      invocation.options = options;
    }
    this.callInvocations.push(invocation);
    const rtcEvent: JsSipNewRtcSessionEvent = {
      originator: "local",
      session,
      request: {},
    };
    queueMicrotask(() => {
      this.emit("newRTCSession", rtcEvent);
    });
    return session;
  }

  emitIncomingSession(session: MockJsSipRtcSession): void {
    const rtcEvent: JsSipNewRtcSessionEvent = {
      originator: "remote",
      session,
      request: {},
    };
    this.emit("newRTCSession", rtcEvent);
  }
}

type RawLikeJsSipRtcSession = Readonly<{
  id: string;
  connection: unknown;
  remote_identity: { toString: () => string };
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  off: (event: string, listener: (...args: unknown[]) => void) => void;
  answer: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  hold: () => boolean;
  unhold: () => boolean;
}>;

function createRawLikeJsSipRtcSession(
  id: string,
  remoteIdentity = '"Alice" <sip:101@pbx.example>',
): RawLikeJsSipRtcSession {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  return {
    id,
    connection: null,
    remote_identity: { toString: () => remoteIdentity },
    on(event: string, listener: (...args: unknown[]) => void) {
      const bucket = listeners.get(event) ?? new Set();
      bucket.add(listener);
      listeners.set(event, bucket);
    },
    off(event: string, listener: (...args: unknown[]) => void) {
      listeners.get(event)?.delete(listener);
    },
    answer: vi.fn(),
    terminate: vi.fn(),
    hold: () => false,
    unhold: () => false,
  };
}

describe("JsSipTelephonyAdapter", () => {
  const account = createSipAccount(createSipAccountId("agent"), {
    username: "agent",
    password: "secret",
    domain: "pbx.example",
    server: "wss://onedemoserver.online:7443",
  });

  function createAdapter(mockUa: MockJsSipUa): JsSipTelephonyAdapter {
    return new JsSipTelephonyAdapter({
      logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
      createUserAgent: () => mockUa,
    });
  }

  async function registerAdapter(adapter: JsSipTelephonyAdapter, mockUa: MockJsSipUa): Promise<void> {
    const result = await adapter.register({ account, correlationId: createCorrelationId() });
    expect(result.ok).toBe(true);
    expect(mockUa.isRegistered()).toBe(true);
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
    mockUa.emit("registrationFailed", { cause: "Authentication Error" });

    const result = await registerPromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Authentication Error");
    }
  });

  it("succeeds when transient Connection Error precedes registered", async () => {
    const mockUa = new MockJsSipUa();
    mockUa.setRegistrationOutcome("hang");
    const adapter = createAdapter(mockUa);

    const registerPromise = adapter.register({
      account,
      correlationId: createCorrelationId(),
    });

    await Promise.resolve();

    mockUa.emit("registrationFailed", { cause: "Connection Error" });
    mockUa.emit("registrationFailed", { cause: "Connection Error" });
    mockUa.markRegistered();
    mockUa.emit("registered");

    const result = await registerPromise;
    expect(result.ok).toBe(true);
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

  it("blindTransfer sends REFER to target URI and succeeds on NOTIFY accepted", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("blind-transfer");
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("400"),
      correlationId: createCorrelationId(),
    });
    const session = mockUa.callInvocations[0]?.session;
    session?.emit("confirmed");
    await makePromise;

    const result = await adapter.blindTransfer({
      callId,
      targetNumber: createPhoneNumber("401"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(session?.referInvocations).toHaveLength(1);
    expect(session?.referInvocations[0]?.target).toBe("sip:401@pbx.example");
  });

  it("blindTransfer sends tel Refer-To for external E.164 target", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("blind-transfer-external");
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("400"),
      correlationId: createCorrelationId(),
    });
    const session = mockUa.callInvocations[0]?.session;
    session?.emit("confirmed");
    await makePromise;

    const result = await adapter.blindTransfer({
      callId,
      targetNumber: createPhoneNumber("+79001234567"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(session?.referInvocations).toHaveLength(1);
    expect(session?.referInvocations[0]?.target).toBe("sip:+79001234567@pbx.example");
  });

  it("blindTransfer fails when REFER request is rejected", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("blind-transfer-fail");
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("402"),
      correlationId: createCorrelationId(),
    });
    const session = mockUa.callInvocations[0]?.session;
    session?.emit("confirmed");
    await makePromise;
    if (session !== undefined) {
      session.referScenario = "request_failed";
    }

    const result = await adapter.blindTransfer({
      callId,
      targetNumber: createPhoneNumber("403"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("REFER failed");
    }
  });

  it("blindTransfer fails when session is missing", async () => {
    const adapter = createAdapter(new MockJsSipUa());
    const result = await adapter.blindTransfer({
      callId: createCallId("missing-blind"),
      targetNumber: createPhoneNumber("404"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("SIP session not found");
    }
  });

  it("attendedTransfer sends REFER with Replaces and succeeds on NOTIFY accepted", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const sourceCallId = createCallId("source-attended");
    const sourcePromise = adapter.makeCall({
      callId: sourceCallId,
      number: createPhoneNumber("500"),
      correlationId: createCorrelationId(),
    });
    const sourceSession = mockUa.callInvocations[0]?.session;
    sourceSession?.emit("confirmed");
    await sourcePromise;

    const consultationCallId = createCallId("consult-attended");
    const consultationPromise = adapter.makeCall({
      callId: consultationCallId,
      number: createPhoneNumber("501"),
      correlationId: createCorrelationId(),
    });
    const consultationSession = mockUa.callInvocations[1]?.session;
    consultationSession?.emit("confirmed");
    await consultationPromise;

    const result = await adapter.attendedTransfer({
      sourceCallId,
      consultationCallId,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(sourceSession?.referInvocations).toHaveLength(1);
    expect(sourceSession?.referInvocations[0]?.target).toBe("sip:100@pbx.example");
    expect(sourceSession?.referInvocations[0]?.options?.replaces).toBe(consultationSession);
  });

  it("attendedTransfer fails when NOTIFY reports failure", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const sourceCallId = createCallId("source-attended-fail");
    const sourcePromise = adapter.makeCall({
      callId: sourceCallId,
      number: createPhoneNumber("502"),
      correlationId: createCorrelationId(),
    });
    const sourceSession = mockUa.callInvocations[0]?.session;
    sourceSession?.emit("confirmed");
    await sourcePromise;

    const consultationCallId = createCallId("consult-attended-fail");
    const consultationPromise = adapter.makeCall({
      callId: consultationCallId,
      number: createPhoneNumber("503"),
      correlationId: createCorrelationId(),
    });
    const consultationSession = mockUa.callInvocations[1]?.session;
    consultationSession?.emit("confirmed");
    await consultationPromise;
    if (sourceSession !== undefined) {
      sourceSession.referScenario = "notify_failed";
    }

    const result = await adapter.attendedTransfer({
      sourceCallId,
      consultationCallId,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Transfer target declined");
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

  it("binds and resolves peer connections per call id", () => {
    const adapter = new JsSipTelephonyAdapter({
      logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
      createUserAgent: () => new MockJsSipUa(),
    });
    const callId = createCallId("pc-call");
    const connection = { id: "pc-1" };

    expect(adapter.getPeerConnectionForCall(callId)).toBeNull();

    adapter.bindPeerConnection(callId, connection);
    expect(adapter.getPeerConnectionForCall(callId)).toBe(connection);

    adapter.unbindPeerConnection(callId);
    expect(adapter.getPeerConnectionForCall(callId)).toBeNull();
  });

  it("makeCall returns answered when session confirms", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("out-1");
    const correlationId = createCorrelationId();
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("200"),
      correlationId,
    });

    const session = mockUa.callInvocations[0]?.session;
    expect(session).toBeDefined();
    session?.emit("confirmed");

    const result = await makePromise;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stage).toBe("answered");
    }
    expect(mockUa.callInvocations[0]?.target).toBe("sip:200@pbx.example");
  });

  it("makeCall returns progress 183 when session emits early media", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const makePromise = adapter.makeCall({
      callId: createCallId("out-progress"),
      number: createPhoneNumber("201"),
      correlationId: createCorrelationId(),
    });

    const session = mockUa.callInvocations[0]?.session;
    session?.emit("progress", { response: { status_code: 183 } });

    const result = await makePromise;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ stage: "progress", progressCode: 183 });
    }
  });

  it("invokes call answered handler when session confirms after progress", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callAnsweredHandler = vi.fn(() => Promise.resolve());
    adapter.setCallAnsweredHandler(callAnsweredHandler);

    const callId = createCallId("out-deferred-answer");
    const correlationId = createCorrelationId();
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("203"),
      correlationId,
    });

    const session = mockUa.callInvocations[0]?.session;
    session?.emit("progress", { response: { status_code: 180 } });

    const progressResult = await makePromise;
    expect(progressResult.ok).toBe(true);
    if (progressResult.ok) {
      expect(progressResult.value).toEqual({ stage: "progress", progressCode: 180 });
    }
    expect(callAnsweredHandler).not.toHaveBeenCalled();

    session?.emit("confirmed");
    await Promise.resolve();

    expect(callAnsweredHandler).toHaveBeenCalledWith({
      callId,
      correlationId,
    });
  });

  it("invokes call answered handler once when session accepts after progress 180", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callAnsweredHandler = vi.fn(() => Promise.resolve());
    adapter.setCallAnsweredHandler(callAnsweredHandler);

    const callId = createCallId("out-accepted-only");
    const correlationId = createCorrelationId();
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("204"),
      correlationId,
    });

    const session = mockUa.callInvocations[0]?.session;
    session?.emit("progress", { response: { status_code: 180 } });
    await makePromise;

    session?.emit("accepted");
    session?.emit("accepted");
    await Promise.resolve();

    expect(callAnsweredHandler).toHaveBeenCalledTimes(1);
    expect(callAnsweredHandler).toHaveBeenCalledWith({ callId, correlationId });
  });

  it("invokes peer connection bound handler when session exposes peer connection", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const peerConnectionHandler = vi.fn(() => Promise.resolve());
    adapter.setPeerConnectionBoundHandler(peerConnectionHandler);

    const callId = createCallId("out-pc-bound");
    const correlationId = createCorrelationId();
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("205"),
      correlationId,
    });

    const session = mockUa.callInvocations[0]?.session;
    const connection = { id: "pc-outbound" };
    session?.emit("peerconnection", { peerconnection: connection });
    session?.emit("progress", { response: { status_code: 180 } });
    await makePromise;

    expect(peerConnectionHandler).toHaveBeenCalledWith({ callId, correlationId });
    expect(adapter.getPeerConnectionForCall(callId)).toBe(connection);
  });

  it("makeCall returns failure when session fails", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const makePromise = adapter.makeCall({
      callId: createCallId("out-fail"),
      number: createPhoneNumber("202"),
      correlationId: createCorrelationId(),
    });

    mockUa.callInvocations[0]?.session.emit("failed", { cause: "Busy" });

    const result = await makePromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Busy");
    }
  });

  it("invokes incoming handler for remote newRTCSession", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const incomingHandler = vi.fn(() => Promise.resolve());
    adapter.setIncomingCallHandler(incomingHandler);

    const session = new MockJsSipRtcSession("incoming-1", '"Alice" <sip:101@pbx.example>');
    mockUa.emitIncomingSession(session);

    await Promise.resolve();

    expect(incomingHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteNumber: "101",
        remoteDisplayNameRaw: "Alice",
      }),
    );
  });

  it("wraps raw JsSIP-like session on remote newRTCSession before lifecycle wiring", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const incomingHandler = vi.fn(() => Promise.resolve());
    adapter.setIncomingCallHandler(incomingHandler);

    const rawSession = createRawLikeJsSipRtcSession("incoming-raw");
    mockUa.emit("newRTCSession", {
      originator: "remote",
      session: rawSession,
      request: {},
    });

    await Promise.resolve();

    expect(incomingHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteNumber: "101",
        remoteDisplayNameRaw: "Alice",
      }),
    );
  });

  it("answerCall invokes session answer with audio constraints", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    adapter.setIncomingCallHandler(() => Promise.resolve());

    const callId = createCallId("incoming-answer");
    const session = new MockJsSipRtcSession("incoming-answer");
    mockUa.emitIncomingSession(session);
    await Promise.resolve();

    const result = await adapter.answerCall({
      callId,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(session.answerCalls).toBe(1);
    expect(session.answerOptions).toEqual(
      expect.objectContaining({
        mediaConstraints: { audio: true, video: false },
      }),
    );
  });

  it("rejectCall terminates session with sip code", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const session = new MockJsSipRtcSession("incoming-reject");
    adapter.setIncomingCallHandler(() => Promise.resolve());
    mockUa.emitIncomingSession(session);
    await Promise.resolve();

    const callId = createCallId(session.id);
    const result = await adapter.rejectCall({
      callId,
      correlationId: createCorrelationId(),
      sipCode: 486,
      reason: "Busy Here",
    });

    expect(result.ok).toBe(true);
    expect(session.terminateCalls).toBe(1);
    expect(session.terminateOptions).toEqual(
      expect.objectContaining({
        status_code: 486,
        reason_phrase: "Busy Here",
      }),
    );
  });

  it("holdCall invokes session hold re-INVITE and succeeds", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("hold-call");
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("310"),
      correlationId: createCorrelationId(),
    });
    const session = mockUa.callInvocations[0]?.session;
    session?.emit("confirmed");
    await makePromise;

    const result = await adapter.holdCall({
      callId,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(session?.holdCalls).toBe(1);
  });

  it("resumeCall invokes session unhold re-INVITE after hold", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("resume-call");
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("311"),
      correlationId: createCorrelationId(),
    });
    const session = mockUa.callInvocations[0]?.session;
    session?.emit("confirmed");
    await makePromise;

    await adapter.holdCall({ callId, correlationId: createCorrelationId() });

    const result = await adapter.resumeCall({
      callId,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(session?.unholdCalls).toBe(1);
  });

  it("holdCall fails when session is missing", async () => {
    const adapter = createAdapter(new MockJsSipUa());
    const result = await adapter.holdCall({
      callId: createCallId("missing-hold"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("SIP session not found");
    }
  });

  it("holdCall fails when JsSIP hold is unavailable", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("hold-unavailable");
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("312"),
      correlationId: createCorrelationId(),
    });
    const session = mockUa.callInvocations[0]?.session;
    session?.emit("confirmed");
    await makePromise;
    if (session !== undefined) {
      session.holdAvailable = false;
    }

    const result = await adapter.holdCall({
      callId,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("hold is not available");
    }
  });

  it("holdCall fails when hold re-INVITE fails", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("hold-failed");
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("313"),
      correlationId: createCorrelationId(),
    });
    const session = mockUa.callInvocations[0]?.session;
    session?.emit("confirmed");
    await makePromise;
    if (session !== undefined) {
      session.hold = () => {
        session.holdCalls += 1;
        queueMicrotask(() => {
          session.emit("failed", { cause: "WebRTC Error" });
        });
        return true;
      };
    }

    const result = await adapter.holdCall({
      callId,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("hold failed");
    }
  });

  it("hangup terminates active session", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callId = createCallId("hangup-call");
    const makePromise = adapter.makeCall({
      callId,
      number: createPhoneNumber("300"),
      correlationId: createCorrelationId(),
    });
    mockUa.callInvocations[0]?.session.emit("confirmed");
    await makePromise;

    const result = await adapter.hangup({
      callId,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(mockUa.callInvocations[0]?.session.terminateCalls).toBe(1);
  });

  it("invokes call ended handler and unbinds peer connection on session end", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callEndedHandler = vi.fn(() => Promise.resolve());
    adapter.setCallEndedHandler(callEndedHandler);
    adapter.setIncomingCallHandler(() => Promise.resolve());

    const session = new MockJsSipRtcSession("ended-session");
    const connection = { id: "pc-ended" };
    session.setConnection(connection);
    mockUa.emitIncomingSession(session);
    await Promise.resolve();

    session.emit("peerconnection", { peerconnection: connection });
    const callId = createCallId(session.id);
    expect(adapter.getPeerConnectionForCall(callId)).toBe(connection);

    session.emit("ended");
    await Promise.resolve();

    expect(callEndedHandler).toHaveBeenCalledWith(
      expect.objectContaining({ callId }),
    );
    expect(adapter.getPeerConnectionForCall(callId)).toBeNull();
  });

  it("supports hold on first session while second outbound session connects (RAT R7-1)", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callIdA = createCallId("r7-out-a");
    const callIdB = createCallId("r7-out-b");

    const makePromiseA = adapter.makeCall({
      callId: callIdA,
      number: createPhoneNumber("410"),
      correlationId: createCorrelationId(),
    });
    const sessionA = mockUa.callInvocations[0]?.session;
    sessionA?.emit("confirmed");
    await makePromiseA;

    const holdResult = await adapter.holdCall({
      callId: callIdA,
      correlationId: createCorrelationId(),
    });
    expect(holdResult.ok).toBe(true);
    expect(sessionA?.holdCalls).toBe(1);

    const makePromiseB = adapter.makeCall({
      callId: callIdB,
      number: createPhoneNumber("411"),
      correlationId: createCorrelationId(),
    });
    const sessionB = mockUa.callInvocations[1]?.session;
    sessionB?.emit("confirmed");
    await makePromiseB;

    expect(mockUa.callInvocations).toHaveLength(2);
    expect(sessionB?.holdCalls).toBe(0);
  });

  it("hangup active session leaves held session operable for resume (RAT R7-4)", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);

    const callIdHeld = createCallId("r7-held");
    const callIdActive = createCallId("r7-active");

    const makeHeld = adapter.makeCall({
      callId: callIdHeld,
      number: createPhoneNumber("420"),
      correlationId: createCorrelationId(),
    });
    const heldSession = mockUa.callInvocations[0]?.session;
    heldSession?.emit("confirmed");
    await makeHeld;

    await adapter.holdCall({
      callId: callIdHeld,
      correlationId: createCorrelationId(),
    });

    const makeActive = adapter.makeCall({
      callId: callIdActive,
      number: createPhoneNumber("421"),
      correlationId: createCorrelationId(),
    });
    const activeSession = mockUa.callInvocations[1]?.session;
    activeSession?.emit("confirmed");
    await makeActive;

    const hangupResult = await adapter.hangup({
      callId: callIdActive,
      correlationId: createCorrelationId(),
    });
    expect(hangupResult.ok).toBe(true);
    await Promise.resolve();

    const resumeResult = await adapter.resumeCall({
      callId: callIdHeld,
      correlationId: createCorrelationId(),
    });
    expect(resumeResult.ok).toBe(true);
    expect(heldSession?.unholdCalls).toBe(1);
    expect(activeSession?.terminateCalls).toBe(1);
  });

  it("registers incoming session while outbound session remains tracked (RAT R7-2)", async () => {
    const mockUa = new MockJsSipUa();
    const adapter = createAdapter(mockUa);
    await registerAdapter(adapter, mockUa);
    adapter.setIncomingCallHandler(() => Promise.resolve());

    const callIdOutbound = createCallId("r7-outbound");
    const makeOutbound = adapter.makeCall({
      callId: callIdOutbound,
      number: createPhoneNumber("430"),
      correlationId: createCorrelationId(),
    });
    mockUa.callInvocations[0]?.session.emit("confirmed");
    await makeOutbound;

    const incomingSession = new MockJsSipRtcSession("r7-incoming");
    mockUa.emitIncomingSession(incomingSession);
    await Promise.resolve();

    const callIdIncoming = createCallId(incomingSession.id);
    const holdOutbound = await adapter.holdCall({
      callId: callIdOutbound,
      correlationId: createCorrelationId(),
    });
    expect(holdOutbound.ok).toBe(true);

    const answerResult = await adapter.answerCall({
      callId: callIdIncoming,
      correlationId: createCorrelationId(),
    });
    expect(answerResult.ok).toBe(true);
    expect(incomingSession.answerCalls).toBe(1);
    expect(mockUa.callInvocations[0]?.session.holdCalls).toBe(1);
  });
});

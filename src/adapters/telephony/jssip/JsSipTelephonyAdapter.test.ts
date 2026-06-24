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

  it("returns not_implemented for deferred transfer operations", async () => {
    const adapter = createAdapter(new MockJsSipUa());
    const correlationId = createCorrelationId();
    const callId = createCallId("call-1");

    const blindResult = await adapter.blindTransfer({
      callId,
      correlationId,
      targetNumber: createPhoneNumber("400"),
    });
    expect(blindResult.ok).toBe(false);
    if (!blindResult.ok) {
      expect(blindResult.error.code).toBe("not_implemented");
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
});

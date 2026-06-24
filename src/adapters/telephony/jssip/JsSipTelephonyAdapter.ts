import type {
  AnswerCallCommand,
  AttendedTransferCommand,
  BlindTransferCommand,
  HangupCommand,
  HoldCallCommand,
  MakeCallCommand,
  MakeCallProgress,
  RegisterAccountCommand,
  RejectCallCommand,
  ResumeCallCommand,
  SendDtmfCommand,
  TelephonyCallEndedNotification,
  TelephonyGateway,
  TelephonyIncomingCallNotification,
  TelephonyTransportDisconnectedNotification,
} from "@ports/index.js";
import type { CallId, SipAccount } from "@domain/index.js";
import { createCallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { JsSipDisconnectEvent, JsSipUaPort, JsSipUserAgentFactory } from "./JsSipUaPort.js";
import { mapTelephonyIncomingNotification } from "../mapTelephonyIncomingNotification.js";
import { buildOutgoingSipTarget } from "./buildOutgoingSipTarget.js";
import { executeJsSipOutboundCall } from "./executeJsSipOutboundCall.js";
import type { JsSipNewRtcSessionEvent, JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import { wireJsSipRtcSessionLifecycle } from "./wireJsSipRtcSessionLifecycle.js";
import { createJsSipUserAgent } from "./createJsSipUserAgent.js";
import { telephonyNotImplementedError } from "./telephonyNotImplementedError.js";
import { resolveJsSipTransportUrl } from "./resolveJsSipTransportUrl.js";

const FEATURE_ID_REGISTRATION = "F-001";
const FEATURE_ID_INCOMING = "F-002";
const FEATURE_ID_OUTGOING = "F-003";

const DEFAULT_CALL_MEDIA_OPTIONS = {
  mediaConstraints: { audio: true, video: false },
  rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
} as const;

export type JsSipTelephonyAdapterOptions = Readonly<{
  logger: Logger;
  createUserAgent?: JsSipUserAgentFactory;
}>;

/**
 * - Purpose: real SIP telephony via JsSIP behind TelephonyGateway (RAT R1–R3).
 * - Inputs: register/call commands; incoming and ended session handlers.
 * - Outputs: registration results; call progress; transport notifications.
 */
export class JsSipTelephonyAdapter implements TelephonyGateway {
  private readonly logger: Logger;
  private readonly createUserAgent: JsSipUserAgentFactory;
  private readonly sessions = new Map<CallId, JsSipRtcSessionPort>();
  private readonly peerConnections = new Map<CallId, unknown>();
  private readonly callCorrelations = new Map<CallId, CorrelationId>();
  private readonly callIdBySessionId = new Map<string, CallId>();
  private ua: JsSipUaPort | null = null;
  private storedAccount: SipAccount | null = null;
  private lastCorrelationId: CorrelationId = createCorrelationId();
  private intentionalShutdown = false;
  private registrationInFlight = false;
  private incomingCallHandler:
    | ((notification: TelephonyIncomingCallNotification) => Promise<void>)
    | null = null;
  private callEndedHandler:
    | ((notification: TelephonyCallEndedNotification) => Promise<void>)
    | null = null;
  private transportDisconnectedHandler:
    | ((notification: TelephonyTransportDisconnectedNotification) => Promise<void>)
    | null = null;

  constructor(options: JsSipTelephonyAdapterOptions) {
    this.logger = options.logger;
    this.createUserAgent = options.createUserAgent ?? createJsSipUserAgent;
  }

  async register(
    command: RegisterAccountCommand,
  ): Promise<Result<void, PlatformError>> {
    const { account, correlationId } = command;
    this.lastCorrelationId = correlationId;

    this.logger.info("jssip_register_start", {
      correlationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_register",
      username: account.username,
      registrar: account.registrar,
    });

    await this.teardownUa();

    this.registrationInFlight = true;

    try {
      const ua = this.createUserAgent(account);
      this.ua = ua;
      this.storedAccount = account;
      this.attachUaListeners(ua);

      const transportUrl = resolveJsSipTransportUrl(account.registrar);
      this.logger.info("jssip_transport_url_resolved", {
        correlationId,
        featureId: FEATURE_ID_REGISTRATION,
        boundedContext: "Telephony",
        operation: "jssip_transport_url_resolved",
        registrar: account.registrar,
        transportUrl,
      });

      const registrationResult = await this.startAndRegister(ua);
      if (!registrationResult.ok) {
        this.logger.error("jssip_register_failed", {
          correlationId,
          featureId: FEATURE_ID_REGISTRATION,
          boundedContext: "Telephony",
          operation: "jssip_register",
          result: registrationResult.error.code,
        });
        return registrationResult;
      }

      this.logger.info("jssip_register_succeeded", {
        correlationId,
        featureId: FEATURE_ID_REGISTRATION,
        boundedContext: "Telephony",
        operation: "jssip_register",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      await this.teardownUa();
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "jssip_register_failed",
        {
          correlationId,
          featureId: FEATURE_ID_REGISTRATION,
          boundedContext: "Telephony",
          operation: "jssip_register",
          result: normalized.code,
        },
        error,
      );
      return err(normalized);
    } finally {
      this.registrationInFlight = false;
    }
  }

  async unregister(correlationId: CorrelationId): Promise<Result<void, PlatformError>> {
    this.lastCorrelationId = correlationId;

    if (this.ua === null) {
      return ok(undefined);
    }

    this.intentionalShutdown = true;

    try {
      const ua = this.ua;
      await this.stopUa(ua);
      this.ua = null;
      this.storedAccount = null;
      this.sessions.clear();
      this.peerConnections.clear();
      this.callCorrelations.clear();
      this.callIdBySessionId.clear();

      this.logger.info("jssip_unregister_succeeded", {
        correlationId,
        featureId: FEATURE_ID_REGISTRATION,
        boundedContext: "Telephony",
        operation: "jssip_unregister",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      return err(normalized);
    } finally {
      this.intentionalShutdown = false;
    }
  }

  async reconnectTransport(
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    this.lastCorrelationId = correlationId;

    if (this.storedAccount === null) {
      return err(
        createPlatformError(
          "operation_failed",
          "SIP transport reconnect failed: no stored account",
        ),
      );
    }

    const ua = this.ua;
    if (ua !== null && ua.isConnected() && ua.isRegistered()) {
      return ok(undefined);
    }

    if (ua !== null && ua.isConnected() && !ua.isRegistered()) {
      const registerResult = await this.registerWithUa(ua);
      return registerResult;
    }

    return this.register({
      account: this.storedAccount,
      correlationId,
    });
  }

  async makeCall(command: MakeCallCommand): Promise<Result<MakeCallProgress, PlatformError>> {
    const { callId, number, correlationId } = command;
    this.lastCorrelationId = correlationId;

    if (this.ua === null || !this.ua.isRegistered() || this.storedAccount === null) {
      return err(
        createPlatformError("operation_failed", "SIP not registered for outbound call"),
      );
    }

    const target = buildOutgoingSipTarget(number, this.storedAccount);

    this.logger.info("jssip_make_call_start", {
      correlationId,
      featureId: FEATURE_ID_OUTGOING,
      boundedContext: "Telephony",
      operation: "jssip_make_call",
      callId,
      target,
    });

    try {
      const session = this.ua.call(target, DEFAULT_CALL_MEDIA_OPTIONS);
      this.registerSession(callId, session, correlationId);
      this.attachSessionLifecycle(callId, session, correlationId, FEATURE_ID_OUTGOING);

      const progressResult = await executeJsSipOutboundCall(session);

      this.logger.info("jssip_make_call_result", {
        correlationId,
        featureId: FEATURE_ID_OUTGOING,
        boundedContext: "Telephony",
        operation: "jssip_make_call",
        callId,
        result: progressResult.ok ? progressResult.value.stage : progressResult.error.code,
      });

      return progressResult;
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "jssip_make_call_failed",
        {
          correlationId,
          featureId: FEATURE_ID_OUTGOING,
          boundedContext: "Telephony",
          operation: "jssip_make_call",
          callId,
          result: normalized.code,
        },
        error,
      );
      return err(normalized);
    }
  }

  answerCall(command: AnswerCallCommand): Promise<Result<void, PlatformError>> {
    const { callId, correlationId } = command;
    this.lastCorrelationId = correlationId;

    const session = this.sessions.get(callId);
    if (session === undefined) {
      return Promise.resolve(
        err(createPlatformError("operation_failed", `SIP session not found for ${callId}`)),
      );
    }

    this.logger.info("jssip_answer_call_start", {
      correlationId,
      featureId: FEATURE_ID_INCOMING,
      boundedContext: "Telephony",
      operation: "jssip_answer_call",
      callId,
    });

    try {
      session.answer(DEFAULT_CALL_MEDIA_OPTIONS);
      this.logger.info("jssip_answer_call_succeeded", {
        correlationId,
        featureId: FEATURE_ID_INCOMING,
        boundedContext: "Telephony",
        operation: "jssip_answer_call",
        callId,
        result: "succeeded",
      });
      return Promise.resolve(ok(undefined));
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "jssip_answer_call_failed",
        {
          correlationId,
          featureId: FEATURE_ID_INCOMING,
          boundedContext: "Telephony",
          operation: "jssip_answer_call",
          callId,
          result: normalized.code,
        },
        error,
      );
      return Promise.resolve(err(normalized));
    }
  }

  rejectCall(command: RejectCallCommand): Promise<Result<void, PlatformError>> {
    const { callId, correlationId, sipCode, reason } = command;
    this.lastCorrelationId = correlationId;

    const session = this.sessions.get(callId);
    if (session === undefined) {
      return Promise.resolve(
        err(createPlatformError("operation_failed", `SIP session not found for ${callId}`)),
      );
    }

    const statusCode = sipCode ?? 486;
    const reasonPhrase = reason ?? "Busy Here";

    this.logger.info("jssip_reject_call_start", {
      correlationId,
      featureId: FEATURE_ID_INCOMING,
      boundedContext: "Telephony",
      operation: "jssip_reject_call",
      callId,
      sipCode: statusCode,
    });

    try {
      session.terminate({
        status_code: statusCode,
        reason_phrase: reasonPhrase,
      });
      this.logger.info("jssip_reject_call_succeeded", {
        correlationId,
        featureId: FEATURE_ID_INCOMING,
        boundedContext: "Telephony",
        operation: "jssip_reject_call",
        callId,
        result: "succeeded",
      });
      return Promise.resolve(ok(undefined));
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "jssip_reject_call_failed",
        {
          correlationId,
          featureId: FEATURE_ID_INCOMING,
          boundedContext: "Telephony",
          operation: "jssip_reject_call",
          callId,
          result: normalized.code,
        },
        error,
      );
      return Promise.resolve(err(normalized));
    }
  }

  sendDtmf(command: SendDtmfCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("sendDtmf")));
  }

  hangup(command: HangupCommand): Promise<Result<void, PlatformError>> {
    const { callId, correlationId } = command;
    this.lastCorrelationId = correlationId;

    const session = this.sessions.get(callId);
    if (session === undefined) {
      return Promise.resolve(
        err(createPlatformError("operation_failed", `SIP session not found for ${callId}`)),
      );
    }

    this.logger.info("jssip_hangup_start", {
      correlationId,
      featureId: FEATURE_ID_OUTGOING,
      boundedContext: "Telephony",
      operation: "jssip_hangup",
      callId,
    });

    try {
      session.terminate();
      this.logger.info("jssip_hangup_succeeded", {
        correlationId,
        featureId: FEATURE_ID_OUTGOING,
        boundedContext: "Telephony",
        operation: "jssip_hangup",
        callId,
        result: "succeeded",
      });
      return Promise.resolve(ok(undefined));
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "jssip_hangup_failed",
        {
          correlationId,
          featureId: FEATURE_ID_OUTGOING,
          boundedContext: "Telephony",
          operation: "jssip_hangup",
          callId,
          result: normalized.code,
        },
        error,
      );
      return Promise.resolve(err(normalized));
    }
  }

  holdCall(command: HoldCallCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("holdCall")));
  }

  resumeCall(command: ResumeCallCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("resumeCall")));
  }

  blindTransfer(command: BlindTransferCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("blindTransfer")));
  }

  attendedTransfer(command: AttendedTransferCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("attendedTransfer")));
  }

  setIncomingCallHandler(
    handler: ((notification: TelephonyIncomingCallNotification) => Promise<void>) | null,
  ): () => void {
    this.incomingCallHandler = handler;
    return () => {
      this.incomingCallHandler = null;
    };
  }

  setCallEndedHandler(
    handler: ((notification: TelephonyCallEndedNotification) => Promise<void>) | null,
  ): () => void {
    this.callEndedHandler = handler;
    return () => {
      this.callEndedHandler = null;
    };
  }

  setTransportDisconnectedHandler(
    handler: ((notification: TelephonyTransportDisconnectedNotification) => Promise<void>) | null,
  ): () => void {
    this.transportDisconnectedHandler = handler;
    return () => {
      this.transportDisconnectedHandler = null;
    };
  }

  /**
   * Adapter-private hook for BrowserMediaAdapter (RAT R2). Not part of TelephonyGateway.
   */
  getPeerConnectionForCall(callId: CallId): unknown {
    return this.peerConnections.get(callId) ?? null;
  }

  /**
   * Adapter-private hook invoked when a JsSIP RTC session is created (RAT R4+).
   */
  bindPeerConnection(callId: CallId, connection: unknown): void {
    this.peerConnections.set(callId, connection);
    this.logger.debug("jssip_peer_connection_bound", {
      correlationId: this.lastCorrelationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_peer_connection_bound",
      callId,
    });
  }

  /**
   * Adapter-private hook invoked when a JsSIP RTC session ends (RAT R4+).
   */
  unbindPeerConnection(callId: CallId): void {
    const session = this.sessions.get(callId);
    if (session !== undefined) {
      this.callIdBySessionId.delete(session.id);
    }
    this.peerConnections.delete(callId);
    this.sessions.delete(callId);
    this.callCorrelations.delete(callId);
    this.logger.debug("jssip_peer_connection_unbound", {
      correlationId: this.lastCorrelationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_peer_connection_unbound",
      callId,
    });
  }

  private registerSession(
    callId: CallId,
    session: JsSipRtcSessionPort,
    correlationId: CorrelationId,
  ): void {
    this.sessions.set(callId, session);
    this.callCorrelations.set(callId, correlationId);
    this.callIdBySessionId.set(session.id, callId);
  }

  private attachSessionLifecycle(
    callId: CallId,
    session: JsSipRtcSessionPort,
    correlationId: CorrelationId,
    featureId: string,
  ): void {
    wireJsSipRtcSessionLifecycle({
      callId,
      correlationId,
      featureId,
      session,
      logger: this.logger,
      onPeerConnection: (boundCallId, connection) => {
        this.bindPeerConnection(boundCallId, connection);
      },
      onSessionEnded: (endedCallId, endedCorrelationId) => {
        void this.handleSessionEnded(endedCallId, endedCorrelationId);
      },
    });
  }

  private attachUaListeners(ua: JsSipUaPort): void {
    ua.on("disconnected", (...args: unknown[]) => {
      const event = args[0];
      if (!isJsSipDisconnectEvent(event)) {
        return;
      }
      void this.handleTransportDisconnected(event);
    });

    ua.on("newRTCSession", (...args: unknown[]) => {
      const event = args[0];
      if (!isJsSipNewRtcSessionEvent(event)) {
        return;
      }
      void this.handleNewRtcSession(event);
    });
  }

  private async handleNewRtcSession(event: JsSipNewRtcSessionEvent): Promise<void> {
    if (event.originator === "local") {
      if (this.callIdBySessionId.has(event.session.id)) {
        return;
      }
      return;
    }

    if (this.incomingCallHandler === null) {
      event.session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
      return;
    }

    const callId = createCallId(event.session.id);
    const correlationId = createCorrelationId();
    this.lastCorrelationId = correlationId;

    this.registerSession(callId, event.session, correlationId);
    this.attachSessionLifecycle(callId, event.session, correlationId, FEATURE_ID_INCOMING);

    const remoteHeader = event.session.getRemoteIdentityHeader();
    const notification = mapTelephonyIncomingNotification({
      callId: event.session.id,
      fromHeader: remoteHeader,
      remoteNumber: remoteHeader,
      correlationId,
    });

    this.logger.info("jssip_incoming_call_received", {
      correlationId,
      featureId: FEATURE_ID_INCOMING,
      boundedContext: "Telephony",
      operation: "jssip_incoming_call",
      callId,
    });

    await this.incomingCallHandler(notification);
  }

  private async handleSessionEnded(
    callId: CallId,
    correlationId: CorrelationId,
  ): Promise<void> {
    this.unbindPeerConnection(callId);

    if (this.callEndedHandler === null) {
      return;
    }

    this.logger.info("jssip_call_ended", {
      correlationId,
      featureId: FEATURE_ID_OUTGOING,
      boundedContext: "Telephony",
      operation: "jssip_call_ended",
      callId,
    });

    await this.callEndedHandler({ callId, correlationId });
  }

  private async handleTransportDisconnected(event: JsSipDisconnectEvent): Promise<void> {
    if (
      this.intentionalShutdown ||
      this.registrationInFlight ||
      this.transportDisconnectedHandler === null
    ) {
      return;
    }

    const reason = formatDisconnectReason(event);

    this.logger.warn("jssip_transport_disconnected", {
      correlationId: this.lastCorrelationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_transport_disconnected",
      reason,
    });

    await this.transportDisconnectedHandler({
      correlationId: this.lastCorrelationId,
      reason,
    });
  }

  private async startAndRegister(ua: JsSipUaPort): Promise<Result<void, PlatformError>> {
    ua.start();
    return this.registerWithUa(ua);
  }

  private registerWithUa(ua: JsSipUaPort): Promise<Result<void, PlatformError>> {
    return new Promise((resolve) => {
      const onRegistered = (): void => {
        cleanup();
        resolve(ok(undefined));
      };

      const onFailed = (...args: unknown[]): void => {
        cleanup();
        const event = args[0];
        const cause =
          typeof event === "object" &&
          event !== null &&
          "cause" in event &&
          typeof event.cause === "string"
            ? event.cause
            : "registration_failed";
        resolve(
          err(
            createPlatformError(
              "operation_failed",
              `SIP registration failed for ${this.storedAccount?.username ?? "account"}: ${cause}`,
            ),
          ),
        );
      };

      const cleanup = (): void => {
        ua.off("registered", onRegistered);
        ua.off("registrationFailed", onFailed);
      };

      ua.on("registered", onRegistered);
      ua.on("registrationFailed", onFailed);
      ua.register();
    });
  }

  private async stopUa(ua: JsSipUaPort): Promise<void> {
    if (ua.isRegistered()) {
      await new Promise<void>((resolve) => {
        const onUnregistered = (): void => {
          ua.off("unregistered", onUnregistered);
          resolve();
        };
        ua.on("unregistered", onUnregistered);
        ua.unregister({ all: true });
      });
    }

    ua.stop();
  }

  private async teardownUa(): Promise<void> {
    if (this.ua === null) {
      return;
    }

    this.intentionalShutdown = true;
    try {
      await this.stopUa(this.ua);
    } finally {
      this.ua = null;
      this.intentionalShutdown = false;
    }
  }
}

function formatDisconnectReason(event: JsSipDisconnectEvent): string {
  if (event.reason !== undefined && event.reason.length > 0) {
    return event.reason;
  }

  if (event.error) {
    const code = event.code !== undefined ? String(event.code) : "unknown";
    return `transport_error:${code}`;
  }

  return "transport_disconnected";
}

function isJsSipDisconnectEvent(value: unknown): value is JsSipDisconnectEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { error?: unknown };
  return typeof candidate.error === "boolean";
}

function isJsSipNewRtcSessionEvent(value: unknown): value is JsSipNewRtcSessionEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    originator?: unknown;
    session?: unknown;
  };

  if (candidate.originator !== "local" && candidate.originator !== "remote") {
    return false;
  }

  if (typeof candidate.session !== "object" || candidate.session === null) {
    return false;
  }

  const session = candidate.session as { id?: unknown };
  return typeof session.id === "string";
}

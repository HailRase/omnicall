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
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { JsSipDisconnectEvent, JsSipUaPort, JsSipUserAgentFactory } from "./JsSipUaPort.js";
import { createJsSipUserAgent } from "./createJsSipUserAgent.js";
import { telephonyNotImplementedError } from "./telephonyNotImplementedError.js";
import { resolveJsSipTransportUrl } from "./resolveJsSipTransportUrl.js";

const FEATURE_ID = "F-001";

export type JsSipTelephonyAdapterOptions = Readonly<{
  logger: Logger;
  createUserAgent?: JsSipUserAgentFactory;
}>;

/**
 * - Purpose: real SIP telephony via JsSIP behind TelephonyGateway (RAT R1).
 * - Inputs: register/unregister/reconnect commands; transport disconnect handler.
 * - Outputs: registration results; transport notifications; stub errors for call ops.
 */
export class JsSipTelephonyAdapter implements TelephonyGateway {
  private readonly logger: Logger;
  private readonly createUserAgent: JsSipUserAgentFactory;
  private readonly sessions = new Map<CallId, unknown>();
  private readonly peerConnections = new Map<CallId, unknown>();
  private ua: JsSipUaPort | null = null;
  private storedAccount: SipAccount | null = null;
  private lastCorrelationId: CorrelationId = createCorrelationId();
  private intentionalShutdown = false;
  private registrationInFlight = false;
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
      featureId: FEATURE_ID,
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
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "jssip_transport_url_resolved",
        registrar: account.registrar,
        transportUrl,
      });

      const registrationResult = await this.startAndRegister(ua);
      if (!registrationResult.ok) {
        this.logger.error("jssip_register_failed", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "jssip_register",
          result: registrationResult.error.code,
        });
        return registrationResult;
      }

      this.logger.info("jssip_register_succeeded", {
        correlationId,
        featureId: FEATURE_ID,
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
          featureId: FEATURE_ID,
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

      this.logger.info("jssip_unregister_succeeded", {
        correlationId,
        featureId: FEATURE_ID,
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

  makeCall(command: MakeCallCommand): Promise<Result<MakeCallProgress, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("makeCall")));
  }

  answerCall(command: AnswerCallCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("answerCall")));
  }

  rejectCall(command: RejectCallCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("rejectCall")));
  }

  sendDtmf(command: SendDtmfCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("sendDtmf")));
  }

  hangup(command: HangupCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(err(telephonyNotImplementedError("hangup")));
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
    void handler;
    return () => undefined;
  }

  setCallEndedHandler(
    handler: ((notification: TelephonyCallEndedNotification) => Promise<void>) | null,
  ): () => void {
    void handler;
    return () => undefined;
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
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "jssip_peer_connection_bound",
      callId,
    });
  }

  /**
   * Adapter-private hook invoked when a JsSIP RTC session ends (RAT R4+).
   */
  unbindPeerConnection(callId: CallId): void {
    this.peerConnections.delete(callId);
    this.sessions.delete(callId);
    this.logger.debug("jssip_peer_connection_unbound", {
      correlationId: this.lastCorrelationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "jssip_peer_connection_unbound",
      callId,
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
      featureId: FEATURE_ID,
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

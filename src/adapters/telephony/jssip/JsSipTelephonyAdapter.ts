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
  TelephonyCallAnsweredNotification,
  TelephonyRemoteHoldNotification,
  TelephonyRemoteResumeNotification,
  TelephonyGateway,
  TelephonyIncomingCallNotification,
  TelephonyTransportConnectingNotification,
  TelephonyTransportConnectedNotification,
  TelephonyTransportDisconnectedNotification,
  TelephonyRegistrationFailedNotification,
} from "@ports/index.js";
import type { CallId, SipAccount } from "@domain/index.js";
import { createCallId, mapSipRegistrationFailureFromParts } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { RTCSession } from "@hailrase/jssip/lib/RTCSession.js";
import type { JsSipDisconnectEvent, JsSipUaPort, JsSipUserAgentFactory } from "./JsSipUaPort.js";
import { mapTelephonyIncomingNotification } from "../mapTelephonyIncomingNotification.js";
import { buildAttendedReferTarget } from "./buildAttendedReferTarget.js";
import { buildBlindReferTarget } from "./buildBlindReferTarget.js";
import { buildOutgoingSipTarget } from "./buildOutgoingSipTarget.js";
import { executeJsSipOutboundCall } from "./executeJsSipOutboundCall.js";
import { executeJsSipHoldResume } from "./executeJsSipHoldResume.js";
import { executeJsSipRefer } from "./executeJsSipRefer.js";
import { executeJsSipSendDtmf } from "./executeJsSipSendDtmf.js";
import type { JsSipNewRtcSessionEvent, JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import { wireJsSipRtcSessionLifecycle } from "./wireJsSipRtcSessionLifecycle.js";
import { createJsSipUserAgent } from "./createJsSipUserAgent.js";
import { ensureJsSipRtcSessionPort, resolveReplacesForRefer, resolveReplacesStorageTarget } from "./wrapJsSipRtcSession.js";
import { awaitJsSipRegistration } from "./awaitJsSipRegistration.js";
import { extractJsSipRegistrationFailureParts } from "./extractJsSipRegistrationFailureParts.js";
import { resolveJsSipTransportUrl } from "./resolveJsSipTransportUrl.js";

const FEATURE_ID_REGISTRATION = "F-001";
const FEATURE_ID_INCOMING = "F-002";
const FEATURE_ID_OUTGOING = "F-003";
const FEATURE_ID_HOLD = "F-004";
const FEATURE_ID_REMOTE_HOLD = "F-004";
const FEATURE_ID_BLIND_TRANSFER = "F-006";
const FEATURE_ID_ATTENDED_TRANSFER = "F-007";
const FEATURE_ID_DTMF = "F-008";

const DEFAULT_CALL_MEDIA_OPTIONS = {
  mediaConstraints: { audio: true, video: false },
  rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
} as const;

const DEFAULT_TRANSPORT_CONNECTION_TIMEOUT_MS = 10_000;

export type JsSipTelephonyAdapterOptions = Readonly<{
  logger: Logger;
  createUserAgent?: JsSipUserAgentFactory;
}>;

export type TelephonyPeerConnectionBoundNotification = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
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
  private readonly replacesSessions = new Map<CallId, unknown>();
  private readonly peerConnections = new Map<CallId, unknown>();
  private readonly callCorrelations = new Map<CallId, CorrelationId>();
  private readonly callIdBySessionId = new Map<string, CallId>();
  private readonly referInFlightCallIds = new Set<CallId>();
  private ua: JsSipUaPort | null = null;
  private storedAccount: SipAccount | null = null;
  private lastCorrelationId: CorrelationId = createCorrelationId();
  private intentionalShutdown = false;
  private registrationInFlight = false;
  private registrationInvalidated = false;
  private transportConnectedNotified = false;
  private incomingCallHandler:
    | ((notification: TelephonyIncomingCallNotification) => Promise<void>)
    | null = null;
  private callEndedHandler:
    | ((notification: TelephonyCallEndedNotification) => Promise<void>)
    | null = null;
  private callAnsweredHandler:
    | ((notification: TelephonyCallAnsweredNotification) => Promise<void>)
    | null = null;
  private remoteHoldHandler:
    | ((notification: TelephonyRemoteHoldNotification) => Promise<void>)
    | null = null;
  private remoteResumeHandler:
    | ((notification: TelephonyRemoteResumeNotification) => Promise<void>)
    | null = null;
  private peerConnectionBoundHandler:
    | ((notification: TelephonyPeerConnectionBoundNotification) => Promise<void>)
    | null = null;
  private transportDisconnectedHandler:
    | ((notification: TelephonyTransportDisconnectedNotification) => Promise<void>)
    | null = null;
  private transportConnectingHandler:
    | ((notification: TelephonyTransportConnectingNotification) => Promise<void>)
    | null = null;
  private transportConnectedHandler:
    | ((notification: TelephonyTransportConnectedNotification) => Promise<void>)
    | null = null;
  private registrationFailedHandler:
    | ((notification: TelephonyRegistrationFailedNotification) => Promise<void>)
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
      server: account.server,
      domain: account.domain,
    });

    await this.teardownUa();

    this.registrationInFlight = true;

    try {
      const ua = this.createUserAgent(account);
      this.ua = ua;
      this.storedAccount = account;
      this.transportConnectedNotified = false;
      this.attachUaListeners(ua);

      const transportUrl = resolveJsSipTransportUrl(account.server);
      this.logger.info("jssip_transport_url_resolved", {
        correlationId,
        featureId: FEATURE_ID_REGISTRATION,
        boundedContext: "Telephony",
        operation: "jssip_transport_url_resolved",
        server: account.server,
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

      this.registrationInvalidated = false;
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
      this.replacesSessions.clear();
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

    this.logger.info("jssip_transport_reconnect_start", {
      correlationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_transport_reconnect",
    });

    await this.teardownActiveUa();
    this.registrationInFlight = true;
    this.registrationInvalidated = true;

    try {
      const ua = this.createUserAgent(this.storedAccount);
      this.ua = ua;
      this.transportConnectedNotified = false;
      this.attachUaListeners(ua);
      ua.start();

      const transportResult = await this.ensureTransportReady(ua);
      if (!transportResult.ok) {
        await this.teardownActiveUa();
        this.logger.error("jssip_transport_reconnect_failed", {
          correlationId,
          featureId: FEATURE_ID_REGISTRATION,
          boundedContext: "Telephony",
          operation: "jssip_transport_reconnect",
          result: transportResult.error.code,
        });
        return transportResult;
      }

      this.logger.info("jssip_transport_reconnect_succeeded", {
        correlationId,
        featureId: FEATURE_ID_REGISTRATION,
        boundedContext: "Telephony",
        operation: "jssip_transport_reconnect",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      await this.teardownActiveUa();
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "jssip_transport_reconnect_failed",
        {
          correlationId,
          featureId: FEATURE_ID_REGISTRATION,
          boundedContext: "Telephony",
          operation: "jssip_transport_reconnect",
          result: normalized.code,
        },
        error,
      );
      return err(normalized);
    } finally {
      this.registrationInFlight = false;
    }
  }

  async reregister(
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    this.lastCorrelationId = correlationId;

    const ua = this.ua;
    if (ua === null) {
      return err(
        createPlatformError("operation_failed", "SIP reregister failed: UA not started"),
      );
    }

    if (!ua.isConnected()) {
      return err(
        createPlatformError(
          "operation_failed",
          "SIP reregister failed: transport not connected",
        ),
      );
    }

    this.logger.info("jssip_reregister_start", {
      correlationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_reregister",
    });

    this.registrationInFlight = true;
    this.registrationInvalidated = true;

    try {
      await this.unregisterAllContacts(ua);
      const registerResult = await this.registerWithUa(ua);
      if (registerResult.ok) {
        this.registrationInvalidated = false;
        this.logger.info("jssip_reregister_succeeded", {
          correlationId,
          featureId: FEATURE_ID_REGISTRATION,
          boundedContext: "Telephony",
          operation: "jssip_reregister",
          result: "succeeded",
        });
      } else {
        this.logger.error("jssip_reregister_failed", {
          correlationId,
          featureId: FEATURE_ID_REGISTRATION,
          boundedContext: "Telephony",
          operation: "jssip_reregister",
          result: registerResult.error.code,
        });
      }
      return registerResult;
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "jssip_reregister_failed",
        {
          correlationId,
          featureId: FEATURE_ID_REGISTRATION,
          boundedContext: "Telephony",
          operation: "jssip_reregister",
          result: normalized.code,
        },
        error,
      );
      return err(normalized);
    } finally {
      this.registrationInFlight = false;
    }
  }

  /**
   * Adapter helper: effective registration requires live transport (ADR-0004).
   */
  effectiveIsRegistered(): boolean {
    const ua = this.ua;
    if (ua === null || this.registrationInvalidated) {
      return false;
    }
    return ua.isConnected() && ua.isRegistered();
  }

  async makeCall(command: MakeCallCommand): Promise<Result<MakeCallProgress, PlatformError>> {
    const { callId, number, correlationId } = command;
    this.lastCorrelationId = correlationId;

    if (this.ua === null || !this.effectiveIsRegistered() || this.storedAccount === null) {
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
      this.attachSessionLifecycle(
        callId,
        session,
        correlationId,
        FEATURE_ID_OUTGOING,
        { notifyOnConfirmed: true },
      );

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
    const { callId, tone, correlationId } = command;
    this.lastCorrelationId = correlationId;

    const session = this.sessions.get(callId);
    if (session === undefined) {
      return Promise.resolve(
        err(createPlatformError("operation_failed", `SIP session not found for ${callId}`)),
      );
    }

    this.logger.info("jssip_send_dtmf_start", {
      correlationId,
      featureId: FEATURE_ID_DTMF,
      boundedContext: "Telephony",
      operation: "jssip_send_dtmf",
      callId,
      tone,
    });

    const result = executeJsSipSendDtmf(session, tone);
    if (!result.ok) {
      this.logger.error("jssip_send_dtmf_failed", {
        correlationId,
        featureId: FEATURE_ID_DTMF,
        boundedContext: "Telephony",
        operation: "jssip_send_dtmf",
        callId,
        tone,
        result: result.error.code,
      });
      return Promise.resolve(result);
    }

    this.logger.info("jssip_send_dtmf_succeeded", {
      correlationId,
      featureId: FEATURE_ID_DTMF,
      boundedContext: "Telephony",
      operation: "jssip_send_dtmf",
      callId,
      tone,
      result: "succeeded",
    });
    return Promise.resolve(ok(undefined));
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

  async holdCall(command: HoldCallCommand): Promise<Result<void, PlatformError>> {
    const { callId, correlationId } = command;
    this.lastCorrelationId = correlationId;

    const session = this.sessions.get(callId);
    if (session === undefined) {
      return err(createPlatformError("operation_failed", `SIP session not found for ${callId}`));
    }

    this.logger.info("jssip_hold_call_start", {
      correlationId,
      featureId: FEATURE_ID_HOLD,
      boundedContext: "Telephony",
      operation: "jssip_hold_call",
      callId,
    });

    const holdResult = await executeJsSipHoldResume(session, "hold");

    if (holdResult.ok) {
      this.logger.info("jssip_hold_call_succeeded", {
        correlationId,
        featureId: FEATURE_ID_HOLD,
        boundedContext: "Telephony",
        operation: "jssip_hold_call",
        callId,
        result: "succeeded",
      });
      return holdResult;
    }

    this.logger.error(
      "jssip_hold_call_failed",
      {
        correlationId,
        featureId: FEATURE_ID_HOLD,
        boundedContext: "Telephony",
        operation: "jssip_hold_call",
        callId,
        result: holdResult.error.code,
      },
      holdResult.error,
    );
    return holdResult;
  }

  async resumeCall(command: ResumeCallCommand): Promise<Result<void, PlatformError>> {
    const { callId, correlationId } = command;
    this.lastCorrelationId = correlationId;

    const session = this.sessions.get(callId);
    if (session === undefined) {
      return err(createPlatformError("operation_failed", `SIP session not found for ${callId}`));
    }

    this.logger.info("jssip_resume_call_start", {
      correlationId,
      featureId: FEATURE_ID_HOLD,
      boundedContext: "Telephony",
      operation: "jssip_resume_call",
      callId,
    });

    const resumeResult = await executeJsSipHoldResume(session, "unhold");

    if (resumeResult.ok) {
      this.logger.info("jssip_resume_call_succeeded", {
        correlationId,
        featureId: FEATURE_ID_HOLD,
        boundedContext: "Telephony",
        operation: "jssip_resume_call",
        callId,
        result: "succeeded",
      });
      return resumeResult;
    }

    this.logger.error(
      "jssip_resume_call_failed",
      {
        correlationId,
        featureId: FEATURE_ID_HOLD,
        boundedContext: "Telephony",
        operation: "jssip_resume_call",
        callId,
        result: resumeResult.error.code,
      },
      resumeResult.error,
    );
    return resumeResult;
  }

  async blindTransfer(command: BlindTransferCommand): Promise<Result<void, PlatformError>> {
    const { callId, targetNumber, correlationId } = command;
    this.lastCorrelationId = correlationId;

    const session = this.sessions.get(callId);
    if (session === undefined) {
      return err(createPlatformError("operation_failed", `SIP session not found for ${callId}`));
    }

    if (this.storedAccount === null) {
      return err(createPlatformError("operation_failed", "SIP account not available for transfer"));
    }

    const { target: referTarget, kind: referTargetKind } = buildBlindReferTarget(
      targetNumber,
      this.storedAccount,
    );

    this.logger.info("jssip_blind_transfer_start", {
      correlationId,
      featureId: FEATURE_ID_BLIND_TRANSFER,
      boundedContext: "Telephony",
      operation: "jssip_blind_transfer",
      callId,
      referTarget,
      referTargetKind,
    });

    this.referInFlightCallIds.add(callId);
    try {
      const referResult = await executeJsSipRefer(session, referTarget);

      if (referResult.ok) {
        this.logger.info("jssip_blind_transfer_succeeded", {
          correlationId,
          featureId: FEATURE_ID_BLIND_TRANSFER,
          boundedContext: "Telephony",
          operation: "jssip_blind_transfer",
          callId,
          result: "succeeded",
        });
        return referResult;
      }

      this.logger.error(
        "jssip_blind_transfer_failed",
        {
          correlationId,
          featureId: FEATURE_ID_BLIND_TRANSFER,
          boundedContext: "Telephony",
          operation: "jssip_blind_transfer",
          callId,
          result: referResult.error.code,
          normalizedError: referResult.error.message,
        },
        referResult.error,
      );
      return referResult;
    } finally {
      this.referInFlightCallIds.delete(callId);
    }
  }

  async attendedTransfer(
    command: AttendedTransferCommand,
  ): Promise<Result<void, PlatformError>> {
    const { sourceCallId, consultationCallId, correlationId } = command;
    this.lastCorrelationId = correlationId;

    const sourceSession = this.sessions.get(sourceCallId);
    if (sourceSession === undefined) {
      return err(
        createPlatformError("operation_failed", `SIP session not found for ${sourceCallId}`),
      );
    }

    const consultationSession = this.sessions.get(consultationCallId);
    if (consultationSession === undefined) {
      return err(
        createPlatformError(
          "operation_failed",
          `SIP consultation session not found for ${consultationCallId}`,
        ),
      );
    }

    const replacesStored = this.replacesSessions.get(consultationCallId);
    const replacesSession = resolveReplacesForRefer(replacesStored);
    if (replacesSession === null) {
      return err(
        createPlatformError(
          "operation_failed",
          "SIP consultation dialog not ready for attended transfer",
        ),
      );
    }

    const target = buildAttendedReferTarget(consultationSession.getRemoteIdentityHeader());

    this.logger.info("jssip_attended_transfer_start", {
      correlationId,
      featureId: FEATURE_ID_ATTENDED_TRANSFER,
      boundedContext: "Telephony",
      operation: "jssip_attended_transfer",
      sourceCallId,
      consultationCallId,
      target,
    });

    this.referInFlightCallIds.add(sourceCallId);
    try {
      const referResult = await executeJsSipRefer(sourceSession, target, {
        replacesRawSession: replacesSession,
      });

      if (referResult.ok) {
        this.logger.info("jssip_attended_transfer_succeeded", {
          correlationId,
          featureId: FEATURE_ID_ATTENDED_TRANSFER,
          boundedContext: "Telephony",
          operation: "jssip_attended_transfer",
          sourceCallId,
          consultationCallId,
          result: "succeeded",
        });
        return referResult;
      }

      this.logger.error(
        "jssip_attended_transfer_failed",
        {
          correlationId,
          featureId: FEATURE_ID_ATTENDED_TRANSFER,
          boundedContext: "Telephony",
          operation: "jssip_attended_transfer",
          sourceCallId,
          consultationCallId,
          result: referResult.error.code,
        },
        referResult.error,
      );
      return referResult;
    } finally {
      this.referInFlightCallIds.delete(sourceCallId);
    }
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

  setCallAnsweredHandler(
    handler: ((notification: TelephonyCallAnsweredNotification) => Promise<void>) | null,
  ): () => void {
    this.callAnsweredHandler = handler;
    return () => {
      this.callAnsweredHandler = null;
    };
  }

  setRemoteHoldHandler(
    handler: ((notification: TelephonyRemoteHoldNotification) => Promise<void>) | null,
  ): () => void {
    this.remoteHoldHandler = handler;
    return () => {
      this.remoteHoldHandler = null;
    };
  }

  setRemoteResumeHandler(
    handler: ((notification: TelephonyRemoteResumeNotification) => Promise<void>) | null,
  ): () => void {
    this.remoteResumeHandler = handler;
    return () => {
      this.remoteResumeHandler = null;
    };
  }

  setPeerConnectionBoundHandler(
    handler: ((notification: TelephonyPeerConnectionBoundNotification) => Promise<void>) | null,
  ): () => void {
    this.peerConnectionBoundHandler = handler;
    return () => {
      this.peerConnectionBoundHandler = null;
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

  setTransportConnectingHandler(
    handler: ((notification: TelephonyTransportConnectingNotification) => Promise<void>) | null,
  ): () => void {
    this.transportConnectingHandler = handler;
    return () => {
      this.transportConnectingHandler = null;
    };
  }

  setTransportConnectedHandler(
    handler: ((notification: TelephonyTransportConnectedNotification) => Promise<void>) | null,
  ): () => void {
    this.transportConnectedHandler = handler;
    return () => {
      this.transportConnectedHandler = null;
    };
  }

  setRegistrationFailedHandler(
    handler: ((notification: TelephonyRegistrationFailedNotification) => Promise<void>) | null,
  ): () => void {
    this.registrationFailedHandler = handler;
    return () => {
      this.registrationFailedHandler = null;
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

    const correlationId = this.callCorrelations.get(callId);
    if (this.peerConnectionBoundHandler === null || correlationId === undefined) {
      return;
    }

    void this.peerConnectionBoundHandler({ callId, correlationId });
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
    this.replacesSessions.delete(callId);
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
    session: JsSipRtcSessionPort | RTCSession,
    correlationId: CorrelationId,
  ): void {
    const port = ensureJsSipRtcSessionPort(session);
    this.replacesSessions.set(callId, resolveReplacesStorageTarget(session));
    this.sessions.set(callId, port);
    this.callCorrelations.set(callId, correlationId);
    this.callIdBySessionId.set(port.id, callId);
  }

  private attachSessionLifecycle(
    callId: CallId,
    session: JsSipRtcSessionPort,
    correlationId: CorrelationId,
    featureId: string,
    options?: Readonly<{ notifyOnConfirmed?: boolean }>,
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
      onRemoteHold: (heldCallId, heldCorrelationId) => {
        void this.handleRemoteHold(heldCallId, heldCorrelationId);
      },
      onRemoteResume: (resumedCallId, resumedCorrelationId) => {
        void this.handleRemoteResume(resumedCallId, resumedCorrelationId);
      },
      ...(options?.notifyOnConfirmed === true
        ? {
            onSessionConfirmed: (confirmedCallId, confirmedCorrelationId) => {
              void this.handleSessionConfirmed(confirmedCallId, confirmedCorrelationId);
            },
          }
        : {}),
    });
  }

  private attachUaListeners(ua: JsSipUaPort): void {
    ua.on("connecting", () => {
      void this.handleTransportConnecting();
    });

    ua.on("connected", () => {
      void this.handleTransportConnected();
    });

    ua.on("disconnected", (...args: unknown[]) => {
      const event = args[0];
      if (!isJsSipDisconnectEvent(event)) {
        return;
      }
      void this.handleTransportDisconnected(event);
    });

    ua.on("registrationFailed", (...args: unknown[]) => {
      void this.handleRegistrationFailed(args[0]);
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

    const port = ensureJsSipRtcSessionPort(event.session);
    const callId = createCallId(port.id);
    const correlationId = createCorrelationId();
    this.lastCorrelationId = correlationId;

    this.registerSession(callId, event.session, correlationId);
    this.attachSessionLifecycle(callId, port, correlationId, FEATURE_ID_INCOMING);

    const remoteHeader = port.getRemoteIdentityHeader();
    const notification = mapTelephonyIncomingNotification({
      callId: port.id,
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

  private async handleSessionConfirmed(
    callId: CallId,
    correlationId: CorrelationId,
  ): Promise<void> {
    if (this.callAnsweredHandler === null) {
      return;
    }

    this.logger.info("jssip_call_answered", {
      correlationId,
      featureId: FEATURE_ID_OUTGOING,
      boundedContext: "Telephony",
      operation: "jssip_call_answered",
      callId,
    });

    await this.callAnsweredHandler({ callId, correlationId });
  }

  private async handleSessionEnded(
    callId: CallId,
    correlationId: CorrelationId,
  ): Promise<void> {
    if (this.referInFlightCallIds.has(callId)) {
      return;
    }

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

  private async handleRemoteHold(
    callId: CallId,
    correlationId: CorrelationId,
  ): Promise<void> {
    if (this.remoteHoldHandler === null) {
      return;
    }

    this.logger.info("jssip_remote_hold_received", {
      correlationId,
      featureId: FEATURE_ID_REMOTE_HOLD,
      boundedContext: "Telephony",
      operation: "jssip_remote_hold",
      callId,
    });

    await this.remoteHoldHandler({ callId, correlationId });
  }

  private async handleRemoteResume(
    callId: CallId,
    correlationId: CorrelationId,
  ): Promise<void> {
    if (this.remoteResumeHandler === null) {
      return;
    }

    this.logger.info("jssip_remote_resume_received", {
      correlationId,
      featureId: FEATURE_ID_REMOTE_HOLD,
      boundedContext: "Telephony",
      operation: "jssip_remote_resume",
      callId,
    });

    await this.remoteResumeHandler({ callId, correlationId });
  }

  private async handleTransportConnecting(): Promise<void> {
    if (this.intentionalShutdown || this.transportConnectingHandler === null) {
      return;
    }

    this.logger.debug("jssip_transport_connecting", {
      correlationId: this.lastCorrelationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_transport_connecting",
    });

    await this.transportConnectingHandler({
      correlationId: this.lastCorrelationId,
    });
  }

  private async handleTransportConnected(): Promise<void> {
    if (
      this.intentionalShutdown ||
      this.transportConnectedHandler === null ||
      this.transportConnectedNotified
    ) {
      return;
    }

    this.transportConnectedNotified = true;

    this.logger.info("jssip_transport_connected", {
      correlationId: this.lastCorrelationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_transport_connected",
    });

    await this.transportConnectedHandler({
      correlationId: this.lastCorrelationId,
    });
  }

  private async notifyTransportDisconnected(reason: string): Promise<void> {
    if (this.intentionalShutdown || this.transportDisconnectedHandler === null) {
      return;
    }

    this.registrationInvalidated = true;
    this.transportConnectedNotified = false;

    this.logger.warn("jssip_transport_disconnected_notified", {
      correlationId: this.lastCorrelationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_transport_disconnected_notified",
      reason,
    });

    await this.transportDisconnectedHandler({
      correlationId: this.lastCorrelationId,
      reason,
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

    this.registrationInvalidated = true;
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

  private async handleRegistrationFailed(event: unknown): Promise<void> {
    if (
      this.intentionalShutdown ||
      this.registrationInFlight ||
      this.registrationFailedHandler === null
    ) {
      return;
    }

    const failure = extractJsSipRegistrationFailureParts(event);
    const reason = mapSipRegistrationFailureFromParts(failure.cause, failure.statusCode);

    this.registrationInvalidated = true;

    this.logger.warn("jssip_registration_failed_runtime", {
      correlationId: this.lastCorrelationId,
      featureId: FEATURE_ID_REGISTRATION,
      boundedContext: "Telephony",
      operation: "jssip_registration_failed_runtime",
      reason,
    });

    await this.registrationFailedHandler({
      correlationId: this.lastCorrelationId,
      reason,
      accountId: this.storedAccount?.id ?? null,
    });
  }

  private async startAndRegister(ua: JsSipUaPort): Promise<Result<void, PlatformError>> {
    ua.start();

    const transportResult = await this.ensureTransportReady(ua);
    if (!transportResult.ok) {
      return transportResult;
    }

    return this.registerWithUa(ua);
  }

  private async ensureTransportReady(ua: JsSipUaPort): Promise<Result<void, PlatformError>> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (ua.isConnected()) {
        await this.handleTransportConnected();
        return ok(undefined);
      }
      await Promise.resolve();
    }

    return this.awaitTransportConnection(ua);
  }

  private async awaitTransportConnection(
    ua: JsSipUaPort,
  ): Promise<Result<void, PlatformError>> {
    if (ua.isConnected()) {
      await this.handleTransportConnected();
      return ok(undefined);
    }

    return new Promise((resolve) => {
      let settled = false;
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const settle = (result: Result<void, PlatformError>): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve(result);
      };

      const onConnected = (): void => {
        void this.handleTransportConnected().then(() => {
          settle(ok(undefined));
        });
      };

      const cleanup = (): void => {
        if (timeoutHandle !== null) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        ua.off("connected", onConnected);
      };

      const onTimeout = (): void => {
        void this.notifyTransportDisconnected("transport_connection_timed_out").finally(() => {
          settle(
            err(
              createPlatformError(
                "operation_failed",
                "SIP transport connection timed out",
              ),
            ),
          );
        });
      };

      ua.on("connected", onConnected);
      timeoutHandle = setTimeout(onTimeout, DEFAULT_TRANSPORT_CONNECTION_TIMEOUT_MS);
    });
  }

  private registerWithUa(ua: JsSipUaPort): Promise<Result<void, PlatformError>> {
    return awaitJsSipRegistration({
      ua,
      username: this.storedAccount?.username ?? "account",
    });
  }

  private async stopUa(ua: JsSipUaPort): Promise<void> {
    if (ua.isRegistered()) {
      await this.unregisterAllContacts(ua);
    }

    ua.stop();
  }

  private async unregisterAllContacts(ua: JsSipUaPort): Promise<void> {
    if (!ua.isRegistered()) {
      return;
    }

    await new Promise<void>((resolve) => {
      const onUnregistered = (): void => {
        ua.off("unregistered", onUnregistered);
        resolve();
      };
      ua.on("unregistered", onUnregistered);
      ua.unregister({ all: true });
    });
  }

  private async teardownUa(): Promise<void> {
    await this.teardownActiveUa();
  }

  private async teardownActiveUa(): Promise<void> {
    if (this.ua === null) {
      return;
    }

    this.intentionalShutdown = true;
    try {
      await this.stopUa(this.ua);
    } finally {
      this.ua = null;
      this.sessions.clear();
      this.replacesSessions.clear();
      this.peerConnections.clear();
      this.callCorrelations.clear();
      this.callIdBySessionId.clear();
      this.registrationInvalidated = true;
      this.transportConnectedNotified = false;
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

/**
 * Narrow Application port for SDK call mutations (DI-06).
 * Implemented by binding to AccountBootstrapFacade public methods —
 * no Domain/SIP leakage into the handler.
 */

import type { Call, CallId } from "@domain/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type ExternalSdkCallPort = Readonly<{
  makeCall: (destination: string) => Promise<Result<Call, PlatformError>>;
  answerCall: (callId: CallId) => Promise<Result<Call, PlatformError>>;
  rejectCall: (callId: CallId) => Promise<Result<Call, PlatformError>>;
  hangupCall: (callId: CallId) => Promise<Result<Call, PlatformError>>;
  holdCall: (callId: CallId) => Promise<Result<Call, PlatformError>>;
  resumeCall: (callId: CallId) => Promise<Result<Call, PlatformError>>;
  muteCall: (callId: CallId) => Promise<Result<Call, PlatformError>>;
  unmuteCall: (callId: CallId) => Promise<Result<Call, PlatformError>>;
  sendDtmf: (callId: CallId, tone: string) => Promise<Result<void, PlatformError>>;
}>;

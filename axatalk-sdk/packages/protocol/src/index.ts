/**
 * `@axata/axatalk-protocol` — runtime schemas and inferred types for Axatalk local protocol v1.
 *
 * Schemas are the source of truth (ADR-0014). Types are inferred. This package must not
 * import `@axata/axatalk-sdk` or desktop Domain/Application/Electron/React source.
 *
 * @packageDocumentation
 */

export {
  CAPABILITY_IDS,
  DEFAULT_CAPABILITY_PROFILES,
  DEFAULT_DISCOVERY_HOST,
  DEFAULT_DISCOVERY_PORT,
  DEFAULT_MAX_MESSAGE_BYTES,
  DISCOVERY_PATH,
  DISCOVERY_VERSION,
  FORBIDDEN_WIRE_KEYS,
  MAX_ARRAY_LENGTH,
  MAX_JSON_DEPTH,
  MAX_OBJECT_KEYS,
  PAIRING_PROFILES,
  POP_KEY_ALGORITHM,
  PRIVILEGED_CAPABILITIES,
  PROTOCOL_DEPRECATION_MIN_DAYS,
  PROTOCOL_DEPRECATION_MIN_DESKTOP_MINORS,
  PROTOCOL_MAJOR,
  PROTOCOL_MAX,
  PROTOCOL_MIN,
  REQUEST_DEDUP_TTL_SECONDS,
  SDK_ACTIVATE_CLIENT_TIMEOUT_MS,
  SDK_ACTIVATE_CONSENT_TTL_MS,
  SDK_ACTIVATE_OCP_AUTH_BUDGET_MS,
  SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS,
  V1_DEFERRED_CAMPAIGN_EVENTS,
  V1_PRODUCT_UNAVAILABLE_COMMANDS,
  WS_PATH
} from './constants.js';

export {
  CapabilityIdListSchema,
  CapabilityIdSchema,
  defaultCapabilitiesForProfile,
  isCapabilityInDefaultProfile,
  isPrivilegedCapability,
  PairingProfileSchema,
  type CapabilityId,
  type PairingProfile
} from './capabilities.js';

export {
  isIncompatibleProtocolVersion,
  isProtocolMajorDropAllowed,
  negotiateProtocolVersion,
  type ProtocolNegotiationFailure,
  type ProtocolNegotiationResult,
  type ProtocolNegotiationSuccess
} from './compatibility.js';

export {
  AccountActivateProfileCommandSchema,
  AccountLogoutCommandSchema,
  CallAnswerCommandSchema,
  CallHangupCommandSchema,
  CallHoldCommandSchema,
  CallMuteCommandSchema,
  CallOriginateCommandSchema,
  CallRejectCommandSchema,
  CallResumeCommandSchema,
  CallSendDtmfCommandSchema,
  CallUnmuteCommandSchema,
  COMMAND_TYPES,
  CommandMessageSchema,
  CommandTypeSchema,
  OperatorChangeStatusCommandSchema,
  OperatorFinishAppealCommandSchema,
  OperatorGetReasonsCommandSchema,
  SdkGetSnapshotCommandSchema,
  SdkPingCommandSchema,
  WindowGetStateCommandSchema,
  WindowHideCommandSchema,
  WindowShowCommandSchema,
  type CommandMessage,
  type CommandType
} from './commands.js';

export {
  DiscoveryDocumentSchema,
  type DiscoveryDocument
} from './discovery.js';

export {
  PROTOCOL_ERROR_CODES,
  ProtocolErrorCodeSchema,
  ProtocolErrorObjectSchema,
  type ProtocolErrorCode,
  type ProtocolErrorObject
} from './errors.js';

export {
  PublicCallStateSchema,
  type PublicCallState
} from './call-state.js';

export {
  AccountSessionActivatedEventSchema,
  AccountSessionEndedEventSchema,
  CallAnsweredEventSchema,
  CallEndedEventSchema,
  CallFailedEventSchema,
  CallHeldEventSchema,
  CallIncomingEventSchema,
  CallMutedEventSchema,
  CallOutgoingEventSchema,
  CallResumedEventSchema,
  CallRingingEventSchema,
  CallUnmutedEventSchema,
  EVENT_TYPES,
  EventMessageSchema,
  EventTypeSchema,
  OperatorSessionChangedEventSchema,
  OperatorStatusChangedEventSchema,
  RegistrationChangedEventSchema,
  SdkPermissionChangedEventSchema,
  SdkRevokedEventSchema,
  SdkServerShutdownEventSchema,
  WindowVisibilityChangedEventSchema,
  type EventMessage,
  type EventType
} from './events.js';

export {
  AuthChallengeSchema,
  AuthProofSchema,
  buildPopSigningPayload,
  ClientHelloSchema,
  HandshakeMessageSchema,
  PairingApprovedSchema,
  PairingDeniedSchema,
  PairingMessageSchema,
  PairingPendingSchema,
  PairingRequestSchema,
  ServerHelloSchema,
  type AuthChallenge,
  type AuthProof,
  type ClientHello,
  type HandshakeMessage,
  type PairingApproved,
  type PairingDenied,
  type PairingMessage,
  type PairingPending,
  type PairingRequest,
  type ServerHello
} from './handshake.js';

export {
  ProtocolDocumentSchema,
  WireMessageSchema,
  type ProtocolDocument,
  type WireMessage
} from './messages.js';

export {
  isCommandAvailableInProductV1,
  isDeferredCampaignEventType,
  productDenialCodeForCommand
} from './policy.js';

export {
  AccountLoginSchema,
  ApplicationIdentitySchema,
  Base64UrlSchema,
  IsoTimestampSchema,
  isCurrentProtocolMajor,
  OpaqueIdSchema,
  ProtocolVersionSchema,
  RedactedDisplayNameSchema,
  RedactedPhoneSchema,
  RevisionSchema,
  WireJsonObjectSchema,
  WireJsonValueSchema,
  type AccountLogin,
  type ApplicationIdentity,
  type Base64Url,
  type IsoTimestamp,
  type OpaqueId,
  type ProtocolVersion,
  type RedactedDisplayName,
  type RedactedPhone,
  type Revision,
  type WireJsonObject,
  type WireJsonValue
} from './primitives.js';

export {
  CommandFailureReplySchema,
  CommandSuccessReplySchema,
  ReplyMessageSchema,
  type CommandFailureReply,
  type CommandSuccessReply,
  type ReplyMessage
} from './replies.js';

export {
  SnapshotAccountSectionSchema,
  SnapshotCallSummarySchema,
  SnapshotMessageSchema,
  SnapshotOperatorSectionSchema,
  SnapshotRegistrationSectionSchema,
  SnapshotSectionsSchema,
  SnapshotSessionSectionSchema,
  SnapshotWindowSectionSchema,
  type SnapshotCallSummary,
  type SnapshotMessage,
  type SnapshotSections
} from './snapshot.js';

export {
  DEFAULT_VALIDATION_LIMITS,
  findForbiddenWireKeys,
  validateDiscoveryDocument,
  validateWireMessage,
  validateWithSchema,
  type ValidationFailure,
  type ValidationLimits,
  type ValidationResult,
  type ValidationSuccess
} from './validate.js';

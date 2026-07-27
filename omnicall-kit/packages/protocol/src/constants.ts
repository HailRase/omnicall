/**
 * Frozen protocol v1 constants (ADR-0014…0017, PROTOCOL.md).
 */

/** Current protocol major supported by this package. @public */
export const PROTOCOL_MAJOR = 1 as const;

/** Inclusive protocol major minimum authored by this package. @public */
export const PROTOCOL_MIN = 1 as const;

/** Inclusive protocol major maximum authored by this package. @public */
export const PROTOCOL_MAX = 1 as const;

/** Default IPv4 loopback discovery bind (ADR-0015). @public */
export const DEFAULT_DISCOVERY_HOST = '127.0.0.1' as const;

/** Default discovery / WS TCP port (ADR-0015). @public */
export const DEFAULT_DISCOVERY_PORT = 17341 as const;

/** HTTP discovery path (ADR-0015). @public */
export const DISCOVERY_PATH = '/omnicall/v1/discovery' as const;

/** WebSocket upgrade path (ADR-0015). @public */
export const WS_PATH = '/omnicall/v1/ws' as const;

/** Discovery document version (ADR-0015). @public */
export const DISCOVERY_VERSION = 1 as const;

/** PoP key algorithm id (ADR-0016). @public */
export const POP_KEY_ALGORITHM = 'ECDSA-P256-SHA256' as const;

/**
 * Server-side duplicate `requestId` cache TTL in seconds (ADR-0017 / O-OWN-1).
 * @public
 */
export const REQUEST_DEDUP_TTL_SECONDS = 120 as const;

/** Default gateway frame / message size budget when discovery is unavailable. @public */
export const DEFAULT_MAX_MESSAGE_BYTES = 65_536 as const;

/** Maximum JSON nesting depth accepted by safe validators. @public */
export const MAX_JSON_DEPTH = 32 as const;

/** Maximum array length accepted by safe validators. @public */
export const MAX_ARRAY_LENGTH = 512 as const;

/** Maximum object key count at any single depth. @public */
export const MAX_OBJECT_KEYS = 128 as const;

/**
 * Deprecation calendar floor for dropped protocol majors (ADR-0017).
 * @public
 */
export const PROTOCOL_DEPRECATION_MIN_DAYS = 90 as const;

/**
 * Deprecation desktop-minor floor for dropped protocol majors (ADR-0017).
 * @public
 */
export const PROTOCOL_DEPRECATION_MIN_DESKTOP_MINORS = 2 as const;

/**
 * Capability IDs (ADR-0011 / ADR-0016 / ADR-0020 / ADR-0021).
 * Granular `call.answer|reject|hangup|hold|mute` are additive; `call.control`
 * remains the umbrella (includes DTMF + all granular actions).
 * @public
 */
export const CAPABILITY_IDS = [
  'session.read.redacted',
  'window.show',
  'window.hide',
  'operator.status.write',
  'operator.campaign.read',
  'ocp.acd_context.read',
  'call.originate',
  'call.control',
  'call.answer',
  'call.reject',
  'call.hangup',
  'call.hold',
  'call.mute',
  'account.activate',
  'session.logout'
] as const;

/**
 * Granular call-control caps covered by umbrella `call.control` (ADR-0021).
 * @public
 */
export const CALL_CONTROL_GRANULAR_CAPABILITIES = [
  'call.answer',
  'call.reject',
  'call.hangup',
  'call.hold',
  'call.mute'
] as const;

/** Pairing profile ids (ADR-0016). @public */
export const PAIRING_PROFILES = [
  'presentation',
  'operator',
  'call_controller'
] as const;

/** Default capabilities granted at approve time per profile (ADR-0016). @public */
export const DEFAULT_CAPABILITY_PROFILES = {
  presentation: ['session.read.redacted', 'window.show'],
  operator: [
    'session.read.redacted',
    'window.show',
    'operator.status.write',
    'operator.campaign.read',
    'ocp.acd_context.read',
    'session.logout'
  ],
  call_controller: [
    'session.read.redacted',
    'window.show',
    'operator.status.write',
    'operator.campaign.read',
    'ocp.acd_context.read',
    'session.logout',
    'call.originate',
    'call.control',
    'call.answer',
    'call.reject',
    'call.hangup',
    'call.hold',
    'call.mute'
  ]
} as const;

/**
 * Privileged capabilities never included in default profiles (ADR-0016).
 * @public
 */
export const PRIVILEGED_CAPABILITIES = ['account.activate', 'window.hide'] as const;

/**
 * Commands that exist as schemas but are unavailable on the v1 product surface.
 * Empty after ADR-0013 amendment (2026-07-27): `window:hide` is product-available
 * under privileged + telephony-busy + tray-recovery policy. Kept as a stable export
 * so gateways can keep calling `productDenialCodeForCommand`.
 * @public
 */
export const V1_PRODUCT_UNAVAILABLE_COMMANDS = [] as const;

/**
 * Historical placeholder: campaign events entered protocol v1 in ADR-0019.
 * Kept as an empty list so `isDeferredCampaignEventType` remains a stable export
 * and always returns false for current majors.
 * @public
 */
export const V1_DEFERRED_CAMPAIGN_EVENTS = [] as const;

/**
 * Keys that must never appear on the public wire (ADR-0017 / SECURITY.md).
 * @public
 */
export const FORBIDDEN_WIRE_KEYS = [
  'apiKey',
  'ocpAuthToken',
  'sipPassword',
  'sipAuthPassword',
  'password',
  'secret',
  'privateKey',
  'authorization'
] as const;

/**
 * SDK `account:activate-profile` wall budgets (ADR-0018 activate timeout sync).
 * Must stay aligned with desktop `src/shared/integration/sdkActivateTimeouts.ts`.
 * Consent default remains 120s; broker/SDK hop uses **max** Settings consent (300s)
 * so CRM can wait for Desktop terminal without inventing a shorter timer:
 * maxConsent 300s + max(sip 60s, ocp 115s) + hop 5s = 420s.
 * @public
 */
export const SDK_ACTIVATE_CONSENT_TTL_MS = 120_000 as const;

/** @public */
export const SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS = 60_000 as const;

/** @public */
export const SDK_ACTIVATE_OCP_AUTH_BUDGET_MS = 115_000 as const;

/**
 * Client correlator floor for `account:activate-profile` only.
 * Sized for Settings max consent — not the default 120s modal TTL.
 * @public
 */
export const SDK_ACTIVATE_CLIENT_TIMEOUT_MS = 420_000 as const;

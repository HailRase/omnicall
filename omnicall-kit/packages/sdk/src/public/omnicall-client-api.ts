/**
 * Public API type surface for OmniCallClient namespaces (SDK-05…SDK-08).
 */

import type { CapabilityId, SnapshotMessage } from '@softomnitel/omnicall-protocol';

import type {
  ActivateProfileMode,
  ActivateProfileResult
} from '../internal/account-activate-commands.js';
import type { OmniCallClientError } from '../internal/client-errors.js';
import type { LogoutResult } from '../internal/account-logout-commands.js';
import type { ConnectionState } from '../internal/connection-state.js';
import type {
  OperatorFinishAppealResult,
  OperatorReasonsResult,
  OperatorStatusChangeResult
} from '../internal/operator-commands.js';
import type { OmniCallEvent, PublicEventType } from '../internal/public-event-map.js';
import type {
  AuthClientOptions,
  AuthSessionSnapshot,
  PairingRequiredInfo
} from './auth-client.js';

/** @public */
export type OmniCallClientOptions = AuthClientOptions;

/** @public */
export type CallMutationResult = {
  readonly callId: string;
  readonly revision: number;
};

/**
 * Window visibility commands.
 * `hide` is privileged (`window.hide`) — Origin matrix grant only; never request
 * at pairing. Telephony-busy → `conflict` (ADR-0013).
 * @public
 */
export type OmniCallWindowApi = {
  /** Raise / show desktop window (`window.show`). */
  readonly show: () => Promise<{
    readonly visible: boolean;
    readonly revision: number;
  }>;
  /**
   * Hide to tray / background when granted (`window.hide`).
   * Requires explicit Origin-matrix grant; stripped from pairing requests.
   */
  readonly hide: (input: {
    readonly expectedRevision: number;
  }) => Promise<{
    readonly visible: boolean;
    readonly revision: number;
  }>;
  /** Current visibility projection. */
  readonly getState: () => Promise<{
    readonly visible: boolean;
    readonly revision: number;
  }>;
};

/**
 * Call mutation namespace. Every method requires explicit `expectedRevision`.
 * @public
 */
export type OmniCallCallsApi = {
  readonly originate: (input: {
    readonly destination: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly answer: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly reject: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly hangup: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly hold: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly resume: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly mute: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly unmute: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly sendDtmf: (input: {
    readonly callId: string;
    readonly digits: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
};

/**
 * Operator status namespace (`operator.status.write`).
 * Campaign notify events use `operator.campaign.read` (subscribe / snapshot).
 * ACD MainCallIDInfo events use `ocp.acd_context.read` (`call:acd-context`).
 * Finish appeal is only valid during post-call processing (desktop-enforced).
 * @public
 */
export type OmniCallOperatorApi = {
  readonly getReasons: () => Promise<OperatorReasonsResult>;
  readonly changeStatus: (input: {
    readonly target: 'ready' | 'break';
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }) => Promise<OperatorStatusChangeResult>;
  readonly finishAppeal: (input: {
    readonly expectedRevision: number;
  }) => Promise<OperatorFinishAppealResult>;
};

/**
 * Account namespace: single-shot logout (`session.logout`) + privileged activate
 * (`account.activate`, server-granted only). Cancel logout = do not call logout.
 * No raw credentials / list-profiles.
 * @public
 */
export type OmniCallAccountApi = {
  readonly logout: (input: {
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }) => Promise<LogoutResult>;
  readonly activateProfile: (input: {
    readonly login: string;
    readonly expectedRevision: number;
    readonly mode?: ActivateProfileMode;
  }) => Promise<ActivateProfileResult>;
};

/**
 * OmniCall browser client. Namespaced product APIs only.
 * @public
 */
export type OmniCallClient = {
  readonly getState: () => ConnectionState;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
  readonly getSession: () => AuthSessionSnapshot | undefined;
  readonly preauthDropCount: () => number;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => void;
  readonly onStateChange: (
    listener: (state: ConnectionState) => void
  ) => () => void;
  readonly onPairingRequired: (
    listener: (info: PairingRequiredInfo) => void
  ) => () => void;
  readonly waitUntil: (
    predicate: (state: ConnectionState) => boolean,
    options?: number | Readonly<{ timeoutMs?: number; signal?: AbortSignal }>
  ) => Promise<ConnectionState>;
  readonly getConnectError: () => OmniCallClientError | undefined;
  /** Fresh authenticated snapshot (also after reconnect). */
  readonly getSnapshot: () => Promise<SnapshotMessage>;
  /** Last cached snapshot; `undefined` before first successful fetch. */
  readonly getCachedSnapshot: () => SnapshotMessage | undefined;
  /**
   * Latest-known aggregate concurrency token from snapshots, successful replies,
   * public events, and `stale_state.currentRevision`. `undefined` only before the
   * first observation or after invalidate (disconnect/reconnect/revoke). Does not
   * mutate or pretend `getCachedSnapshot()` is current.
   */
  readonly getRevision: () => number | undefined;
  /**
   * Subscribe to a public product event. Listener payload is narrowed by `type`.
   * Lifecycle `sdk:permission-changed` / `sdk:revoked` are not delivered here —
   * use `getGrantedCapabilities` / connection state (`revoked`).
   */
  readonly subscribe: <T extends PublicEventType>(
    type: T,
    listener: (event: Extract<OmniCallEvent, { type: T }>) => void
  ) => () => void;
  readonly window: OmniCallWindowApi;
  readonly calls: OmniCallCallsApi;
  readonly operator: OmniCallOperatorApi;
  readonly account: OmniCallAccountApi;
};

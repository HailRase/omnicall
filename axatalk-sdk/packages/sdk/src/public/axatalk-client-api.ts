/**
 * Public API type surface for AxatalkClient namespaces (SDK-05…SDK-08).
 */

import type { CapabilityId, SnapshotMessage } from '@axata/axatalk-protocol';

import type { ActivateProfileResult } from '../internal/account-activate-commands.js';
import type { AxatalkClientError } from '../internal/client-errors.js';
import type {
  ConfirmLogoutResult,
  PrepareLogoutResult
} from '../internal/account-logout-commands.js';
import type { ConnectionState } from '../internal/connection-state.js';
import type {
  OperatorReasonsResult,
  OperatorStatusChangeResult
} from '../internal/operator-commands.js';
import type { AxatalkEvent, PublicEventType } from '../internal/public-event-map.js';
import type {
  AuthClientOptions,
  AuthSessionSnapshot,
  PairingRequiredInfo
} from './auth-client.js';

/** @public */
export type AxatalkClientOptions = AuthClientOptions;

/** @public */
export type CallMutationResult = {
  readonly callId: string;
  readonly revision: number;
};

/** @public */
export type AxatalkWindowApi = {
  readonly show: () => Promise<{
    readonly visible: boolean;
    readonly revision: number;
  }>;
  readonly getState: () => Promise<{
    readonly visible: boolean;
    readonly revision: number;
  }>;
};

/**
 * Call mutation namespace. Every method requires explicit `expectedRevision`.
 * @public
 */
export type AxatalkCallsApi = {
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
 * Operator status namespace (`operator.status.write`). No campaign events.
 * @public
 */
export type AxatalkOperatorApi = {
  readonly getReasons: () => Promise<OperatorReasonsResult>;
  readonly changeStatus: (input: {
    readonly target: 'ready' | 'break';
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }) => Promise<OperatorStatusChangeResult>;
};

/**
 * Account namespace: logout (`session.logout`) + privileged activate
 * (`account.activate`, server-granted only). Cancel logout = abandon token /
 * disconnect — no public cancel command. No raw credentials / list-profiles.
 * @public
 */
export type AxatalkAccountApi = {
  readonly prepareLogout: (input: {
    readonly expectedRevision: number;
  }) => Promise<PrepareLogoutResult>;
  readonly confirmLogout: (input: {
    readonly logoutToken: string;
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }) => Promise<ConfirmLogoutResult>;
  readonly activateProfile: (input: {
    readonly profileRef: string;
    readonly expectedRevision: number;
  }) => Promise<ActivateProfileResult>;
};

/**
 * Axatalk browser client. Namespaced product APIs only.
 * @public
 */
export type AxatalkClient = {
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
    timeoutMs?: number
  ) => Promise<ConnectionState>;
  readonly getConnectError: () => AxatalkClientError | undefined;
  readonly getSnapshot: () => Promise<SnapshotMessage>;
  readonly getCachedSnapshot: () => SnapshotMessage | undefined;
  readonly getRevision: () => number | undefined;
  readonly subscribe: <T extends PublicEventType>(
    type: T,
    listener: (event: Extract<AxatalkEvent, { type: T }>) => void
  ) => () => void;
  readonly window: AxatalkWindowApi;
  readonly calls: AxatalkCallsApi;
  readonly operator: AxatalkOperatorApi;
  readonly account: AxatalkAccountApi;
};

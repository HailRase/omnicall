/**
 * Explicit SDK connection states (ARCHITECTURE.md).
 * Account/SIP/OCP authorization are never implied by these states.
 */

/** Explicit SDK connection states (ARCHITECTURE.md). @public */
export const CONNECTION_STATES = [
  'idle',
  'connecting',
  'handshaking',
  'pairing_required',
  'authenticating',
  'ready',
  'reconnecting',
  'incompatible',
  'revoked',
  'failed',
  'closed'
] as const;

/** @public */
export type ConnectionState = (typeof CONNECTION_STATES)[number];

const LEGAL_TRANSITIONS: Readonly<Record<ConnectionState, readonly ConnectionState[]>> = {
  idle: ['connecting', 'closed'],
  connecting: ['handshaking', 'reconnecting', 'failed', 'closed'],
  handshaking: [
    'pairing_required',
    'authenticating',
    'incompatible',
    'reconnecting',
    'failed',
    'closed'
  ],
  pairing_required: ['authenticating', 'revoked', 'reconnecting', 'failed', 'closed'],
  authenticating: [
    'ready',
    'revoked',
    'incompatible',
    'reconnecting',
    'failed',
    'closed'
  ],
  ready: ['reconnecting', 'incompatible', 'revoked', 'failed', 'closed'],
  reconnecting: [
    'connecting',
    'ready',
    'incompatible',
    'revoked',
    'failed',
    'closed'
  ],
  incompatible: ['closed'],
  revoked: ['closed'],
  failed: ['closed'],
  closed: []
};

export function canTransition(
  from: ConnectionState,
  to: ConnectionState
): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: ConnectionState,
  to: ConnectionState
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal connection transition: ${from} -> ${to}`);
  }
}

export function isTerminalConnectionState(state: ConnectionState): boolean {
  return (
    state === 'incompatible' ||
    state === 'revoked' ||
    state === 'failed' ||
    state === 'closed'
  );
}

export function isReconnectEligible(state: ConnectionState): boolean {
  return (
    state === 'connecting' ||
    state === 'handshaking' ||
    state === 'pairing_required' ||
    state === 'authenticating' ||
    state === 'ready' ||
    state === 'reconnecting'
  );
}

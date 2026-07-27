import { describe, expect, it } from 'vitest';

import {
  assertTransition,
  canTransition,
  CONNECTION_STATES,
  isTerminalConnectionState
} from './connection-state.js';

describe('connection state machine', () => {
  it('lists the architecture states', () => {
    expect(CONNECTION_STATES).toEqual([
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
    ]);
  });

  it('allows the happy path to ready and closed', () => {
    const path = [
      ['idle', 'connecting'],
      ['connecting', 'handshaking'],
      ['handshaking', 'authenticating'],
      ['authenticating', 'ready'],
      ['ready', 'closed']
    ] as const;
    for (const [from, to] of path) {
      expect(canTransition(from, to)).toBe(true);
    }
  });

  it('allows pairing branch and reconnect outcomes', () => {
    expect(canTransition('handshaking', 'pairing_required')).toBe(true);
    expect(canTransition('pairing_required', 'authenticating')).toBe(true);
    expect(canTransition('ready', 'reconnecting')).toBe(true);
    expect(canTransition('reconnecting', 'connecting')).toBe(true);
    expect(canTransition('reconnecting', 'ready')).toBe(true);
    expect(canTransition('reconnecting', 'incompatible')).toBe(true);
    expect(canTransition('reconnecting', 'revoked')).toBe(true);
    expect(canTransition('reconnecting', 'failed')).toBe(true);
  });

  it('rejects illegal transitions', () => {
    expect(canTransition('idle', 'ready')).toBe(false);
    expect(canTransition('closed', 'connecting')).toBe(false);
    expect(canTransition('failed', 'ready')).toBe(false);
    expect(() => assertTransition('idle', 'ready')).toThrow(/Illegal connection transition/);
  });

  it('marks terminal states', () => {
    expect(isTerminalConnectionState('incompatible')).toBe(true);
    expect(isTerminalConnectionState('revoked')).toBe(true);
    expect(isTerminalConnectionState('failed')).toBe(true);
    expect(isTerminalConnectionState('closed')).toBe(true);
    expect(isTerminalConnectionState('ready')).toBe(false);
  });
});

/**
 * Redaction-safe diagnostics (SECURITY.md): allowlisted fields only.
 * Never accepts payloads, tokens, phone numbers, or authorization material.
 */

import type { ConnectionState } from './connection-state.js';

export type DiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';

export type DiagnosticResult =
  | 'ok'
  | 'error'
  | 'timeout'
  | 'aborted'
  | 'rejected';

/**
 * Allowlisted diagnostic event. Extra keys must never be attached by producers.
 */
export type DiagnosticEvent = {
  readonly level: DiagnosticLevel;
  readonly code: string;
  readonly connectionState: ConnectionState;
  readonly requestId?: string;
  readonly commandType?: string;
  readonly durationMs?: number;
  readonly result?: DiagnosticResult;
  readonly errorCode?: string;
  readonly attempt?: number;
};

export type DiagnosticsSink = {
  readonly emit: (event: DiagnosticEvent) => void;
};

const FORBIDDEN_DIAGNOSTIC_KEYS = [
  'payload',
  'body',
  'authorization',
  'token',
  'password',
  'secret',
  'privateKey',
  'apiKey',
  'ocpAuthToken',
  'sipPassword',
  'phone',
  'destination',
  'displayName',
  'message'
] as const;

export function createRecordingDiagnosticsSink(): DiagnosticsSink & {
  readonly events: readonly DiagnosticEvent[];
  readonly clear: () => void;
} {
  const events: DiagnosticEvent[] = [];
  return {
    events,
    clear: () => {
      events.length = 0;
    },
    emit: (event) => {
      assertRedactionSafeDiagnostic(event);
      events.push(Object.freeze({ ...event }));
    }
  };
}

export function assertRedactionSafeDiagnostic(event: DiagnosticEvent): void {
  const keys = Object.keys(event);
  for (const key of keys) {
    if ((FORBIDDEN_DIAGNOSTIC_KEYS as readonly string[]).includes(key)) {
      throw new Error(`Forbidden diagnostic key: ${key}`);
    }
  }
}

export function diagnosticContainsForbiddenText(
  event: DiagnosticEvent,
  needles: readonly string[]
): boolean {
  const serialized = JSON.stringify(event);
  return needles.some((needle) => serialized.includes(needle));
}

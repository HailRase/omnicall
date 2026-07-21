/**
 * Parse inbound auth/handshake/pairing/control messages (unknown → schema).
 */

import {
  EventMessageSchema,
  PairingApprovedSchema,
  PairingDeniedSchema,
  PairingPendingSchema,
  ReplyMessageSchema,
  ServerHelloSchema,
  SnapshotMessageSchema,
  validateWithSchema,
  type AuthChallenge,
  type PairingApproved,
  type PairingDenied,
  type PairingPending,
  type ServerHello
} from '@axata/axatalk-protocol';

import { isOriginDeniedWireDetails } from './origin-policy-errors.js';

export type InboundAuthMessage =
  | { readonly kind: 'server_hello'; readonly message: ServerHello }
  | { readonly kind: 'incompatible' }
  | { readonly kind: 'pairing_pending'; readonly message: PairingPending }
  | { readonly kind: 'pairing_approved'; readonly message: PairingApproved }
  | { readonly kind: 'pairing_denied'; readonly message: PairingDenied }
  | { readonly kind: 'permission_changed'; readonly grantedCapabilities: readonly string[] }
  | { readonly kind: 'revoked'; readonly reasonCode: string }
  | { readonly kind: 'origin_denied' }
  | { readonly kind: 'preauth_product'; readonly type: string }
  | { readonly kind: 'ignored' };

export function parseInboundAuthMessage(raw: string): InboundAuthMessage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { kind: 'ignored' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { kind: 'ignored' };
  }
  const type = 'type' in parsed ? parsed.type : undefined;
  const kind = 'kind' in parsed ? parsed.kind : undefined;
  if (kind === 'reply') {
    const reply = validateWithSchema(ReplyMessageSchema, parsed);
    if (
      reply.success &&
      !reply.data.ok &&
      reply.data.error.code === 'forbidden' &&
      isOriginDeniedWireDetails(reply.data.error.details)
    ) {
      return { kind: 'origin_denied' };
    }
  }
  if (type === 'sdk:server-hello') {
    const result = validateWithSchema(ServerHelloSchema, parsed);
    if (result.success) {
      return { kind: 'server_hello', message: result.data };
    }
    if (result.code === 'incompatible_version') {
      return { kind: 'incompatible' };
    }
    return { kind: 'ignored' };
  }
  if (type === 'pairing:pending') {
    const result = validateWithSchema(PairingPendingSchema, parsed);
    return result.success
      ? { kind: 'pairing_pending', message: result.data }
      : { kind: 'ignored' };
  }
  if (type === 'pairing:approved') {
    const result = validateWithSchema(PairingApprovedSchema, parsed);
    return result.success
      ? { kind: 'pairing_approved', message: result.data }
      : { kind: 'ignored' };
  }
  if (type === 'pairing:denied') {
    const result = validateWithSchema(PairingDeniedSchema, parsed);
    return result.success
      ? { kind: 'pairing_denied', message: result.data }
      : { kind: 'ignored' };
  }
  if (type === 'sdk:permission-changed') {
    const result = validateWithSchema(EventMessageSchema, parsed);
    if (!result.success || result.data.type !== 'sdk:permission-changed') {
      return { kind: 'ignored' };
    }
    return {
      kind: 'permission_changed',
      grantedCapabilities: result.data.payload.grantedCapabilities
    };
  }
  if (type === 'sdk:revoked') {
    const result = validateWithSchema(EventMessageSchema, parsed);
    if (!result.success || result.data.type !== 'sdk:revoked') {
      return { kind: 'ignored' };
    }
    return { kind: 'revoked', reasonCode: result.data.payload.reasonCode };
  }
  const snapshot = validateWithSchema(SnapshotMessageSchema, parsed);
  if (snapshot.success) {
    return { kind: 'preauth_product', type: 'snapshot' };
  }
  const event = validateWithSchema(EventMessageSchema, parsed);
  if (event.success) {
    return { kind: 'preauth_product', type: event.data.type };
  }
  return { kind: 'ignored' };
}

export function challengeFromHello(hello: ServerHello): AuthChallenge | undefined {
  return hello.authChallenge;
}

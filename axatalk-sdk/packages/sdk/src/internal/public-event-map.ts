/**
 * Anti-corruption map: wire EventMessage → public AxatalkEvent DTO.
 * Domain Event names (CallAnswered, etc.) never appear on this surface.
 */

import type { EventMessage, EventType } from '@axata/axatalk-protocol';

/** Product event types delivered to AxatalkClient subscribers (SDK-05). @public */
export const PUBLIC_EVENT_TYPES = [
  'call:incoming',
  'call:outgoing',
  'call:ringing',
  'call:answered',
  'call:ended',
  'call:failed',
  'call:held',
  'call:resumed',
  'call:muted',
  'call:unmuted',
  'registration:changed',
  'account:session-activated',
  'account:session-ended',
  'operator:session-changed',
  'operator:status-changed',
  'window:visibility-changed',
  'sdk:server-shutdown'
] as const satisfies readonly EventType[];

/** @public */
export type PublicEventType = (typeof PUBLIC_EVENT_TYPES)[number];

/** Public anti-corruption event DTO (protocol names only). @public */
export type AxatalkEvent = Extract<EventMessage, { type: PublicEventType }>;

const PUBLIC_SET = new Set<string>(PUBLIC_EVENT_TYPES);

export function isPublicEventType(type: string): type is PublicEventType {
  return PUBLIC_SET.has(type);
}

export function toPublicEvent(message: EventMessage): AxatalkEvent | undefined {
  if (!isPublicEventType(message.type)) {
    return undefined;
  }
  return message as AxatalkEvent;
}

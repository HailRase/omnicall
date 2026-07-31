/**
 * Typed public event subscriptions with sequence-gap detection.
 */

import type { DiagnosticsSink } from './diagnostics.js';
import type { ConnectionState } from './connection-state.js';
import {
  toPublicEvent,
  type OmniCallEvent,
  type PublicEventType
} from './public-event-map.js';
import type { EventMessage } from '@softomnitel/omnicall-protocol';

type AnyListener = (event: OmniCallEvent) => void;

export type EventSubscriptionHub = {
  readonly subscribe: <T extends PublicEventType>(
    type: T,
    listener: (event: Extract<OmniCallEvent, { type: T }>) => void
  ) => () => void;
  readonly handleEvent: (
    message: EventMessage,
    connectionState: ConnectionState
  ) => { readonly gap: boolean };
  readonly clearSequence: () => void;
  readonly lastSequence: () => number | undefined;
  readonly clearListeners: () => void;
};

export function createEventSubscriptionHub(deps: {
  readonly diagnostics?: DiagnosticsSink;
  readonly onSequenceGap: () => void;
}): EventSubscriptionHub {
  const listeners = new Map<PublicEventType, Set<AnyListener>>();
  let lastSequence: number | undefined;

  const subscribe = <T extends PublicEventType>(
    type: T,
    listener: (event: Extract<OmniCallEvent, { type: T }>) => void
  ): (() => void) => {
    const set = listeners.get(type) ?? new Set<AnyListener>();
    const wrapped: AnyListener = (event) => {
      if (event.type === type) {
        listener(event as Extract<OmniCallEvent, { type: T }>);
      }
    };
    set.add(wrapped);
    listeners.set(type, set);
    return () => {
      set.delete(wrapped);
      if (set.size === 0) {
        listeners.delete(type);
      }
    };
  };

  const handleEvent = (
    message: EventMessage,
    connectionState: ConnectionState
  ): { readonly gap: boolean } => {
    let gap = false;
    if (lastSequence !== undefined && message.sequence > lastSequence + 1) {
      gap = true;
      deps.diagnostics?.emit({
        level: 'warn',
        code: 'event.sequence_gap',
        connectionState,
        result: 'error'
      });
      deps.onSequenceGap();
    }
    lastSequence = message.sequence;
    const publicEvent = toPublicEvent(message);
    if (publicEvent === undefined) {
      return { gap };
    }
    const set = listeners.get(publicEvent.type);
    if (set === undefined) {
      return { gap };
    }
    for (const listener of set) {
      listener(publicEvent);
    }
    return { gap };
  };

  return {
    subscribe,
    handleEvent,
    clearSequence: () => {
      lastSequence = undefined;
    },
    lastSequence: () => lastSequence,
    clearListeners: () => {
      listeners.clear();
    }
  };
}

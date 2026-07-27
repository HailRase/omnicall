/**
 * Deterministic fake transport for unit tests. No real WebSocket I/O.
 */

import type {
  TransportCloseInfo,
  TransportErrorInfo,
  TransportFactory,
  TransportPort
} from './transport-port.js';

type ListenerSet<T> = Set<(value: T) => void>;

export type FakeTransport = TransportPort & {
  readonly url: string | undefined;
  readonly isOpen: boolean;
  readonly sent: readonly string[];
  readonly openListenerCount: () => number;
  readonly messageListenerCount: () => number;
  readonly closeListenerCount: () => number;
  readonly errorListenerCount: () => number;
  readonly simulateOpen: () => void;
  readonly simulateMessage: (data: string) => void;
  readonly simulateClose: (code?: number, reason?: string) => void;
  readonly simulateError: (info: TransportErrorInfo) => void;
  readonly clearSent: () => void;
};

export type FakeTransportController = {
  readonly create: TransportFactory;
  readonly last: () => FakeTransport | undefined;
  readonly all: () => readonly FakeTransport[];
  readonly clear: () => void;
};

export function createFakeTransportController(): FakeTransportController {
  const instances: FakeTransport[] = [];

  return {
    create: () => {
      const transport = createFakeTransport();
      instances.push(transport);
      return transport;
    },
    last: () => instances[instances.length - 1],
    all: () => instances,
    clear: () => {
      instances.length = 0;
    }
  };
}

export function createFakeTransport(): FakeTransport {
  let open = false;
  let connectedUrl: string | undefined;
  const sent: string[] = [];
  const openListeners = new Set<() => void>();
  const messageListeners: ListenerSet<string> = new Set();
  const closeListeners: ListenerSet<TransportCloseInfo> = new Set();
  const errorListeners: ListenerSet<TransportErrorInfo> = new Set();

  const subscribe = <T>(set: ListenerSet<T>, handler: (value: T) => void): (() => void) => {
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  };

  const subscribeOpen = (handler: () => void): (() => void) => {
    openListeners.add(handler);
    return () => {
      openListeners.delete(handler);
    };
  };

  const transport: FakeTransport = {
    get url() {
      return connectedUrl;
    },
    get isOpen() {
      return open;
    },
    get sent() {
      return sent;
    },
    openListenerCount: () => openListeners.size,
    messageListenerCount: () => messageListeners.size,
    closeListenerCount: () => closeListeners.size,
    errorListenerCount: () => errorListeners.size,
    connect: (url) => {
      if (open) {
        throw new Error('FakeTransport already open');
      }
      connectedUrl = url;
    },
    send: (data) => {
      if (!open) {
        throw new Error('FakeTransport is not open');
      }
      sent.push(data);
    },
    close: (code = 1000, reason = '') => {
      // Notify even when connect() ran but simulateOpen() did not — failed attempt.
      if (connectedUrl === undefined && !open) {
        return;
      }
      open = false;
      connectedUrl = undefined;
      const info = Object.freeze({ code, reason });
      for (const listener of closeListeners) {
        listener(info);
      }
    },
    onOpen: (handler) => subscribeOpen(handler),
    onMessage: (handler) => subscribe(messageListeners, handler),
    onClose: (handler) => subscribe(closeListeners, handler),
    onError: (handler) => subscribe(errorListeners, handler),
    simulateOpen: () => {
      if (connectedUrl === undefined) {
        throw new Error('FakeTransport.connect must be called before simulateOpen');
      }
      if (open) {
        return;
      }
      open = true;
      for (const listener of openListeners) {
        listener();
      }
    },
    simulateMessage: (data) => {
      if (!open) {
        throw new Error('FakeTransport is not open');
      }
      for (const listener of messageListeners) {
        listener(data);
      }
    },
    simulateClose: (code = 1006, reason = 'abnormal') => {
      if (connectedUrl === undefined && !open) {
        return;
      }
      open = false;
      connectedUrl = undefined;
      const info = Object.freeze({ code, reason });
      for (const listener of closeListeners) {
        listener(info);
      }
    },
    simulateError: (info) => {
      for (const listener of errorListeners) {
        listener(info);
      }
    },
    clearSent: () => {
      sent.length = 0;
    }
  };

  return transport;
}

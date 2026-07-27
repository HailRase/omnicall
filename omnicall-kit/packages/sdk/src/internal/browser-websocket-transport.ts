/**
 * Official browser WebSocket adapter for {@link TransportPort}.
 * Protocol / reconnect / auth stay in the connection session — this is bytes only.
 */

import type {
  TransportCloseInfo,
  TransportErrorInfo,
  TransportPort
} from './transport-port.js';

type ListenerSet<T> = Set<(value: T) => void>;

/** Minimal WebSocket surface used by the adapter (browser or injectable test double). @public */
export type BrowserWebSocketLike = {
  readonly readyState: number;
  binaryType: string;
  onopen: ((ev: Event) => void) | null;
  onmessage: ((ev: MessageEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onclose: ((ev: CloseEvent) => void) | null;
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
};

/** Constructor shape compatible with `globalThis.WebSocket`. @public */
export type BrowserWebSocketConstructor = {
  new (url: string): BrowserWebSocketLike;
  readonly OPEN: number;
};

/**
 * Options for {@link createBrowserWebSocketTransport}.
 * @public
 */
export type CreateBrowserWebSocketTransportOptions = {
  /** Inject a WebSocket constructor (tests). Defaults to `globalThis.WebSocket`. */
  readonly webSocket?: BrowserWebSocketConstructor;
};

const UNSUPPORTED_DATA_CLOSE_CODE = 1003;
const UNSUPPORTED_DATA_REASON = 'unsupported_data';

function resolveWebSocketConstructor(
  override: BrowserWebSocketConstructor | undefined
): BrowserWebSocketConstructor {
  if (override !== undefined) {
    return override;
  }
  const globalCtor = (
    globalThis as { WebSocket?: BrowserWebSocketConstructor }
  ).WebSocket;
  if (typeof globalCtor !== 'function') {
    throw new Error(
      'OmniCall Kit: WebSocket is unavailable. Pass transportFactory (tests/Node) or run in a browser with WebSocket.'
    );
  }
  return globalCtor;
}

function subscribe<T>(
  set: ListenerSet<T>,
  handler: (value: T) => void
): () => void {
  set.add(handler);
  return () => {
    set.delete(handler);
  };
}

function emitClose(
  listeners: ListenerSet<TransportCloseInfo>,
  code: number,
  reason: string
): void {
  const info = Object.freeze({ code, reason });
  for (const listener of listeners) {
    listener(info);
  }
}

function emitError(
  listeners: ListenerSet<TransportErrorInfo>,
  info: TransportErrorInfo
): void {
  const frozen = Object.freeze(info);
  for (const listener of listeners) {
    listener(frozen);
  }
}

function normalizeMessageData(data: unknown): string | undefined {
  return typeof data === 'string' ? data : undefined;
}

/**
 * Create one browser WebSocket transport instance.
 * Call once per connect/reconnect attempt (via `transportFactory`).
 * @public
 */
export function createBrowserWebSocketTransport(
  options?: CreateBrowserWebSocketTransportOptions
): TransportPort {
  let socket: BrowserWebSocketLike | undefined;
  let openReadyState = 1;
  let connectAttempted = false;
  const openListeners = new Set<() => void>();
  const messageListeners: ListenerSet<string> = new Set();
  const closeListeners: ListenerSet<TransportCloseInfo> = new Set();
  const errorListeners: ListenerSet<TransportErrorInfo> = new Set();

  const clearSocket = (): void => {
    socket = undefined;
  };

  const attachHandlers = (ws: BrowserWebSocketLike): void => {
    ws.binaryType = 'blob';
    ws.onopen = () => {
      for (const listener of openListeners) {
        listener();
      }
    };
    ws.onmessage = (event) => {
      const text = normalizeMessageData(event.data);
      if (text === undefined) {
        emitError(errorListeners, {
          name: 'WebSocketError',
          message: 'unsupported_data'
        });
        try {
          ws.close(UNSUPPORTED_DATA_CLOSE_CODE, UNSUPPORTED_DATA_REASON);
        } catch {
          emitClose(
            closeListeners,
            UNSUPPORTED_DATA_CLOSE_CODE,
            UNSUPPORTED_DATA_REASON
          );
          clearSocket();
        }
        return;
      }
      for (const listener of messageListeners) {
        listener(text);
      }
    };
    ws.onerror = () => {
      emitError(errorListeners, {
        name: 'WebSocketError',
        message: 'transport_error'
      });
    };
    ws.onclose = (event) => {
      clearSocket();
      emitClose(closeListeners, event.code, event.reason ?? '');
    };
  };

  return {
    connect: (url) => {
      if (connectAttempted || socket !== undefined) {
        throw new Error('BrowserWebSocketTransport already used; create a new instance');
      }
      connectAttempted = true;
      const WebSocketCtor = resolveWebSocketConstructor(options?.webSocket);
      openReadyState = WebSocketCtor.OPEN;
      const ws = new WebSocketCtor(url);
      socket = ws;
      attachHandlers(ws);
    },
    send: (data) => {
      if (socket === undefined || socket.readyState !== openReadyState) {
        throw new Error('BrowserWebSocketTransport is not open');
      }
      socket.send(data);
    },
    close: (code = 1000, reason = '') => {
      if (socket === undefined) {
        if (connectAttempted) {
          emitClose(closeListeners, code, reason);
        }
        return;
      }
      try {
        socket.close(code, reason);
      } catch {
        clearSocket();
        emitClose(closeListeners, code, reason);
      }
    },
    onOpen: (handler) => subscribe(openListeners, handler),
    onMessage: (handler) => subscribe(messageListeners, handler),
    onClose: (handler) => subscribe(closeListeners, handler),
    onError: (handler) => subscribe(errorListeners, handler)
  };
}

/**
 * Injectable browser-compatible transport port.
 * Production default: {@link createBrowserWebSocketTransport}.
 * Tests: FakeTransport via an explicit `transportFactory`.
 */

/** @public */
export type TransportCloseInfo = {
  readonly code: number;
  readonly reason: string;
};

/** @public */
export type TransportErrorInfo = {
  readonly name: string;
  readonly message: string;
};

/**
 * Injectable byte-channel port. Must not own protocol, auth, or reconnect policy.
 * @public
 */
export type TransportPort = {
  readonly connect: (url: string) => void;
  readonly send: (data: string) => void;
  readonly close: (code?: number, reason?: string) => void;
  readonly onOpen: (handler: () => void) => () => void;
  readonly onMessage: (handler: (data: string) => void) => () => void;
  readonly onClose: (handler: (info: TransportCloseInfo) => void) => () => void;
  readonly onError: (handler: (info: TransportErrorInfo) => void) => () => void;
};

/**
 * Creates a fresh {@link TransportPort} per connect/reconnect attempt.
 * @public
 */
export type TransportFactory = () => TransportPort;

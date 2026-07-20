/**
 * Injectable browser-compatible transport port.
 * Real WebSocket adapter arrives in a later unit; SDK-03 uses FakeTransport.
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

/** Injectable transport port (real WebSocket adapter in a later unit). @public */
export type TransportPort = {
  readonly connect: (url: string) => void;
  readonly send: (data: string) => void;
  readonly close: (code?: number, reason?: string) => void;
  readonly onOpen: (handler: () => void) => () => void;
  readonly onMessage: (handler: (data: string) => void) => () => void;
  readonly onClose: (handler: (info: TransportCloseInfo) => void) => () => void;
  readonly onError: (handler: (info: TransportErrorInfo) => void) => () => void;
};

/** @public */
export type TransportFactory = () => TransportPort;

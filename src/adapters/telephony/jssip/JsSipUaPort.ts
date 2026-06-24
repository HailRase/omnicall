/**
 * - Purpose: narrow JsSIP UA surface used by JsSipTelephonyAdapter (testable without JsSIP types in tests).
 * - Inputs: event listeners and lifecycle commands.
 * - Outputs: registration/connection state queries.
 */
export type JsSipDisconnectEvent = Readonly<{
  error: boolean;
  code?: number;
  reason?: string;
}>;

export type JsSipUnregisteredEvent = Readonly<{
  cause?: string;
}>;

export type JsSipUaEventName =
  | "disconnected"
  | "registered"
  | "registrationFailed"
  | "unregistered";

export type JsSipUaListener = (...args: unknown[]) => void;

export type JsSipUaPort = Readonly<{
  on(event: JsSipUaEventName, listener: JsSipUaListener): void;
  off(event: JsSipUaEventName, listener: JsSipUaListener): void;
  start(): void;
  stop(): void;
  register(): void;
  unregister(options?: Readonly<{ all?: boolean }>): void;
  isRegistered(): boolean;
  isConnected(): boolean;
}>;

export type JsSipUserAgentFactory = (
  account: import("@domain/index.js").SipAccount,
) => JsSipUaPort;

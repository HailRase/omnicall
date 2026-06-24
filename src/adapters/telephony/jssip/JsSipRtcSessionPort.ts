/**
 * - Purpose: narrow JsSIP RTC session surface for adapter tests without JsSIP types.
 * - Inputs: session lifecycle listeners and control commands.
 * - Outputs: session id, peer connection access, SIP control side effects.
 */
export type JsSipRtcSessionEventName =
  | "peerconnection"
  | "progress"
  | "accepted"
  | "confirmed"
  | "ended"
  | "failed"
  | "hold"
  | "unhold";

export type JsSipRtcSessionListener = (...args: unknown[]) => void;

export type JsSipReferCommandOptions = Readonly<{
  eventHandlers?: Readonly<Record<string, JsSipRtcSessionListener>>;
  replaces?: unknown;
  extraHeaders?: readonly string[];
}>;

export type JsSipRtcSessionPort = Readonly<{
  id: string;
  on(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void;
  off(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void;
  answer(options?: Readonly<Record<string, unknown>>): void;
  terminate(options?: Readonly<Record<string, unknown>>): void;
  hold(options?: Readonly<Record<string, unknown>>, done?: () => void): boolean;
  unhold(options?: Readonly<Record<string, unknown>>, done?: () => void): boolean;
  refer(target: string, options?: JsSipReferCommandOptions): unknown;
  getConnection(): unknown;
  getRemoteIdentityHeader(): string;
}>;

export type JsSipNewRtcSessionEvent = Readonly<{
  originator: "local" | "remote";
  session: JsSipRtcSessionPort;
  request: unknown;
}>;

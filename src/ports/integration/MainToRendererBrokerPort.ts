/**
 * Main↔renderer typed broker port (ADR-0009). Interface only in DI-01 —
 * no real IPC, preload channels, or BrowserWindow.
 */

import type {
  ProtocolErrorCode,
  ReplyMessage,
  WireJsonObject,
} from "@axatalk/protocol";

/**
 * Narrow broker envelope after protocol validation. Public DTOs only —
 * not Domain Events, not JsSIP, not OCP wire objects.
 */
export type BrokerProductRequest = Readonly<{
  requestId: string;
  commandType: string;
  payload: WireJsonObject;
  expectedRevision?: number;
}>;

export type BrokerRequestSuccess = Readonly<{
  ok: true;
  reply: ReplyMessage;
}>;

export type BrokerRequestFailure = Readonly<{
  ok: false;
  code: ProtocolErrorCode;
}>;

export type BrokerRequestResult = BrokerRequestSuccess | BrokerRequestFailure;

/**
 * Single typed broker path from main gateway → renderer Application composition.
 * Product commands terminate in Application handlers / Facades / Use Cases (DI-02+).
 */
export interface MainToRendererBrokerPort {
  /** True after the single renderer Application composition signals readiness. */
  isReady(): boolean;

  /**
   * Deliver a product request. Input is `unknown` until validated at the boundary.
   * Fail closed with stable protocol codes. Never throws protocol validation errors.
   */
  request(input: unknown): Promise<BrokerRequestResult>;
}

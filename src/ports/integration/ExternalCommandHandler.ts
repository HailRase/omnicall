/**
 * Application-terminating command/query handler interfaces for the external SDK
 * boundary (F-011). Implementations belong in Application (DI-05+ routers), not
 * stores or React. DI-01 ships interfaces + mock doubles only.
 */

import type {
  ProtocolErrorCode,
  WireJsonObject,
} from "@axatalk/protocol";

export type ExternalHandlerSuccess = Readonly<{
  ok: true;
  result: WireJsonObject;
  revision?: number;
}>;

export type ExternalHandlerFailure = Readonly<{
  ok: false;
  code: ProtocolErrorCode;
  retryable: boolean;
  /** Present for `stale_state` so clients can resync (ADR-0017). */
  currentRevision?: number;
}>;

export type ExternalHandlerResult = ExternalHandlerSuccess | ExternalHandlerFailure;

/** Optional request context from the authenticated gateway session (DI-06). */
export type ExternalCommandContext = Readonly<{
  clientId?: string;
}>;

/**
 * Mutating external commands (call, operator, account, window show, etc.).
 * Call mutations pass through Call Engine (DI-06).
 */
export interface ExternalCommandHandler {
  handleCommand(
    input: unknown,
    context?: ExternalCommandContext,
  ): Promise<ExternalHandlerResult>;
}

/**
 * Read-only external queries (snapshot, window state, operator reasons).
 */
export interface ExternalQueryHandler {
  handleQuery(input: unknown): Promise<ExternalHandlerResult>;
}

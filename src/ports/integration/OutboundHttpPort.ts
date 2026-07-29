/**
 * - Purpose: isolate outbound HTTP transport from application execution policy.
 * - Inputs: validated request facts with the fixed dispatch timeout.
 * - Outputs: response or normalized network transport facts.
 */
import type {
  ExternalServiceHttpMethod,
  ExternalServiceKeyValue,
} from "@domain/integration/external-services/ExternalServiceHttpDefinition.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export const OUTBOUND_HTTP_TIMEOUT_MS = 10_000 as const;

export const OUTBOUND_HTTP_ERROR_CODES = [
  "aborted",
  "connection_refused",
  "connection_reset",
  "dns",
  "network",
  "timeout",
  "tls",
  "unknown",
] as const;

export type OutboundHttpErrorCode = (typeof OUTBOUND_HTTP_ERROR_CODES)[number];

export type OutboundHttpRequest = Readonly<{
  method: ExternalServiceHttpMethod;
  url: string;
  headers: ReadonlyArray<ExternalServiceKeyValue>;
  body: string | null;
  timeoutMs: typeof OUTBOUND_HTTP_TIMEOUT_MS;
  correlationId: CorrelationId;
}>;

export type OutboundHttpResult =
  | Readonly<{
      kind: "response";
      status: number;
      durationMs: number;
      body: string;
    }>
  | Readonly<{
      kind: "network_error";
      code: OutboundHttpErrorCode;
      durationMs: number;
      message: string;
    }>;

export interface OutboundHttpPort {
  execute(request: OutboundHttpRequest): Promise<OutboundHttpResult>;
}

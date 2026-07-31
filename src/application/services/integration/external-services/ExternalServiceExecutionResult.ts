/**
 * - Purpose: classify outbound External Services attempts for UI and journal.
 * - Inputs: transport status, duration, body, and normalized error facts.
 * - Outputs: immutable success/error view models without command callbacks.
 */

export type ExternalServiceJsonValidity =
  | "not_applicable"
  | "valid"
  | "invalid";

export type ExternalServiceExecutionResult =
  | Readonly<{
      kind: "success";
      status: number;
      durationMs: number;
      body: string;
      bodyTruncated: boolean;
      jsonValidity: ExternalServiceJsonValidity;
    }>
  | Readonly<{
      kind: "error";
      category: "http" | "network" | "timeout" | "aborted" | "validation";
      status: number | null;
      durationMs: number;
      body: string;
      bodyTruncated: boolean;
      code: string;
      jsonValidity: ExternalServiceJsonValidity;
    }>;

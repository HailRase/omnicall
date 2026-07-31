/**
 * - Purpose: abstract opening a dedicated External Application window.
 * - Inputs: validated resolved URL and screen-pop identity.
 * - Outputs: window-open result without Electron dependency.
 */
import type { CallId } from "@domain/telephony/CallId.js";
import type { ExternalApplicationId } from "@domain/integration/external-applications/ExternalApplicationIds.js";

export type OpenExternalApplicationWindowPayload = Readonly<{
  url: string;
  title: string;
  width: number;
  height: number;
  applicationId: ExternalApplicationId;
  callId: CallId;
}>;

export type OpenExternalApplicationWindowResult =
  | Readonly<{ ok: true; focusedExisting: boolean }>
  | Readonly<{ ok: false; reason: "invalid_payload" | "open_failed" }>;

export interface ExternalApplicationWindowGateway {
  openWindow(
    payload: OpenExternalApplicationWindowPayload,
  ): Promise<OpenExternalApplicationWindowResult>;
}

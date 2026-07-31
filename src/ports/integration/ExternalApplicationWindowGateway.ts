/**
 * - Purpose: abstract opening and call-tied lifecycle for External Application windows.
 * - Inputs: validated resolved URL, screen-pop identity, and call-ended actions.
 * - Outputs: window-open / lifecycle results without Electron dependency.
 */

import type { CallId } from "@domain/telephony/CallId.js";
import type { ExternalApplicationId } from "@domain/integration/external-applications/ExternalApplicationIds.js";
import type { ExternalApplicationOnCallEndedAction } from "@domain/integration/external-applications/ExternalApplicationsSettings.js";

export type OpenExternalApplicationWindowPayload = Readonly<{
  url: string;
  title: string;
  width: number;
  height: number;
  applicationId: ExternalApplicationId;
  callId: CallId;
  raiseOnOpen: boolean;
  alwaysOnTopDuringCall: boolean;
  onCallEnded: ExternalApplicationOnCallEndedAction;
}>;

export type OpenExternalApplicationWindowResult =
  | Readonly<{ ok: true; focusedExisting: boolean }>
  | Readonly<{ ok: false; reason: "invalid_payload" | "open_failed" }>;

export type ApplyExternalApplicationCallEndedPayload = Readonly<{
  callId: CallId;
}>;

export type ApplyExternalApplicationCallEndedResult = Readonly<{
  ok: true;
  affected: number;
}>;

export interface ExternalApplicationWindowGateway {
  openWindow(
    payload: OpenExternalApplicationWindowPayload,
  ): Promise<OpenExternalApplicationWindowResult>;
  applyCallEndedLifecycle(
    payload: ApplyExternalApplicationCallEndedPayload,
  ): Promise<ApplyExternalApplicationCallEndedResult>;
}

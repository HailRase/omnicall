/**
 * - Purpose: bridge the External Application window port to preload IPC.
 * - Inputs: validated Application screen-pop and call-ended commands.
 * - Outputs: typed open/focus/lifecycle results.
 */

import type {
  ApplyExternalApplicationCallEndedPayload,
  ApplyExternalApplicationCallEndedResult,
  ExternalApplicationWindowGateway,
  OpenExternalApplicationWindowPayload,
  OpenExternalApplicationWindowResult,
} from "@ports/integration/ExternalApplicationWindowGateway.js";
import {
  parseApplyExternalApplicationCallEndedPayload,
  parseOpenExternalApplicationWindowPayload,
} from "@shared/ipc/OpenExternalApplicationWindowContract.js";

export class PreloadExternalApplicationWindowGateway
  implements ExternalApplicationWindowGateway
{
  async openWindow(
    payload: OpenExternalApplicationWindowPayload,
  ): Promise<OpenExternalApplicationWindowResult> {
    const parsed = parseOpenExternalApplicationWindowPayload(payload);
    if (parsed === null || window.softphone === undefined) {
      return { ok: false, reason: "invalid_payload" };
    }
    return window.softphone.openExternalApplicationWindow(parsed);
  }

  async applyCallEndedLifecycle(
    payload: ApplyExternalApplicationCallEndedPayload,
  ): Promise<ApplyExternalApplicationCallEndedResult> {
    const parsed = parseApplyExternalApplicationCallEndedPayload(payload);
    if (parsed === null || window.softphone === undefined) {
      return { ok: true, affected: 0 };
    }
    return window.softphone.applyExternalApplicationCallEnded(parsed);
  }
}

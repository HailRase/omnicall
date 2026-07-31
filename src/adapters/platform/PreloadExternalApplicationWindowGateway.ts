/**
 * - Purpose: bridge the External Application window port to preload IPC.
 * - Inputs: validated Application screen-pop commands.
 * - Outputs: typed open/focus result.
 */
import type {
  ExternalApplicationWindowGateway,
  OpenExternalApplicationWindowPayload,
  OpenExternalApplicationWindowResult,
} from "@ports/integration/ExternalApplicationWindowGateway.js";
import { parseOpenExternalApplicationWindowPayload } from "@shared/ipc/OpenExternalApplicationWindowContract.js";

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
}

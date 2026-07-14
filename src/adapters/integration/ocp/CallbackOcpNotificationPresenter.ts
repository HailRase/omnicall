/**
 * - Purpose: mutable OCP notification sink so renderer can attach toast notify after mount.
 * - Inputs: setHandler sink + OcpNotificationPayload from OcpNotificationService.
 * - Outputs: forwards present() to the current handler (no-op when unset).
 */

import type { OcpNotificationPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpNotificationPresenter } from "@ports/integration/OcpNotificationPresenter.js";

export class CallbackOcpNotificationPresenter implements OcpNotificationPresenter {
  private handler: ((notification: OcpNotificationPayload) => void) | null = null;

  setHandler(handler: ((notification: OcpNotificationPayload) => void) | null): void {
    this.handler = handler;
  }

  present(notification: OcpNotificationPayload): void {
    this.handler?.(notification);
  }
}

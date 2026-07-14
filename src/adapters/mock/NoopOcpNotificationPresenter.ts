/**
 * - Purpose: default OCP notification sink until UI wires toast presenter (E-09).
 * - Inputs: OcpNotificationPayload (ignored).
 * - Outputs: no side effects.
 */

import type { OcpNotificationPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpNotificationPresenter } from "@ports/integration/OcpNotificationPresenter.js";

export class NoopOcpNotificationPresenter implements OcpNotificationPresenter {
  present(_notification: OcpNotificationPayload): void {
    void _notification;
  }
}

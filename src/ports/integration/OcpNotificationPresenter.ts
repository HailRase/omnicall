/**
 * - Purpose: present OCP notification entities without coupling Application to renderer.
 * - Inputs: normalized OcpNotificationPayload from gateway.
 * - Outputs: side-effect presentation (toast sink wired by UI/bootstrap).
 */

import type { OcpNotificationPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

export type OcpNotificationHandler = (
  notification: OcpNotificationPayload,
) => void;

export interface OcpNotificationPresenter {
  present(notification: OcpNotificationPayload): void;
  /** Optional sink wiring for callback-style presenters (renderer toast attach). */
  setHandler?(handler: OcpNotificationHandler | null): void;
}

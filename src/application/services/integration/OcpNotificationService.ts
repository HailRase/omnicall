/**
 * - Purpose: forward OCP notification entities to a presenter sink (toast in UI).
 * - Inputs: OcpGateway notification messages.
 * - Outputs: OcpNotificationPresenter.present calls.
 */

import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { OcpNotificationPresenter } from "@ports/integration/OcpNotificationPresenter.js";

export type OcpNotificationServiceDeps = Readonly<{
  ocpGateway: OcpGateway;
  presenter: OcpNotificationPresenter;
}>;

export class OcpNotificationService {
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly deps: OcpNotificationServiceDeps) {
    this.unsubscribe = deps.ocpGateway.onMessage((message) => {
      if (message.entity !== "notification") {
        return;
      }
      this.deps.presenter.present(message.data);
    });
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}

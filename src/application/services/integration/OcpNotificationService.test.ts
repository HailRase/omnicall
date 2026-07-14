import { describe, expect, it } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import type { OcpNotificationPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpNotificationPresenter } from "@ports/integration/OcpNotificationPresenter.js";
import { OcpNotificationService } from "./OcpNotificationService.js";

class RecordingPresenter implements OcpNotificationPresenter {
  readonly presented: OcpNotificationPayload[] = [];

  present(notification: OcpNotificationPayload): void {
    this.presented.push(notification);
  }
}

describe("OcpNotificationService", () => {
  it("forwards notification entity to presenter", () => {
    const gateway = new MockOcpGateway();
    const presenter = new RecordingPresenter();
    const service = new OcpNotificationService({
      ocpGateway: gateway,
      presenter,
    });

    const payload: OcpNotificationPayload = {
      id: "n1",
      uuid: undefined,
      type: "success",
      body: "Hello",
      time: 3,
      blocked: false,
      deleted: false,
      position: "top-right",
    };
    gateway.simulateMessage({ entity: "notification", data: payload });

    expect(presenter.presented).toEqual([payload]);
    service.dispose();
  });
});

import { describe, expect, it } from "vitest";
import { mapOcpNotificationToToastDescriptor } from "./createOcpToastNotificationPresenter.js";

function basePayload(
  overrides: Partial<Parameters<typeof mapOcpNotificationToToastDescriptor>[0]> = {},
): Parameters<typeof mapOcpNotificationToToastDescriptor>[0] {
  return {
    id: "n1",
    uuid: "wire-uuid",
    type: "notify",
    body: "Hello",
    time: 999,
    blocked: false,
    deleted: false,
    sticky: true,
    position: "center",
    ...overrides,
  };
}

describe("mapOcpNotificationToToastDescriptor", () => {
  it("maps success and error from body + type only", () => {
    expect(
      mapOcpNotificationToToastDescriptor(
        basePayload({ type: "success", body: "Done", id: "ok-1" }),
      ),
    ).toEqual({
      id: "ocp-notification-ok-1",
      level: "success",
      messageText: "Done",
      module: "ocp",
      functionId: "ocp.notification",
      interruptClass: "remote",
    });

    expect(
      mapOcpNotificationToToastDescriptor(
        basePayload({ type: "error", body: "OCP failed", id: "err-1" }),
      ),
    ).toEqual({
      id: "ocp-notification-err-1",
      level: "error",
      messageText: "OCP failed",
      module: "ocp",
      functionId: "ocp.notification",
      interruptClass: "remote",
    });
  });

  it("maps unknown warning notify help to info; empty body skipped", () => {
    for (const type of ["warning", "notify", "help", "preloader", "progress"] as const) {
      expect(
        mapOcpNotificationToToastDescriptor(basePayload({ type, body: "Note" })),
      ).toMatchObject({
        level: "info",
        messageText: "Note",
        module: "ocp",
        functionId: "ocp.notification",
        interruptClass: "remote",
      });
    }

    expect(
      mapOcpNotificationToToastDescriptor(basePayload({ body: "   " })),
    ).toBeNull();
  });

  it("ignores deleted blocked sticky position time for presentation", () => {
    const descriptor = mapOcpNotificationToToastDescriptor(
      basePayload({
        type: "success",
        body: "Still shown",
        deleted: true,
        blocked: true,
        sticky: true,
        position: "top-left",
        time: 42,
        uuid: "ignored-uuid",
      }),
    );

    expect(descriptor).toEqual({
      id: "ocp-notification-n1",
      level: "success",
      messageText: "Still shown",
      module: "ocp",
      functionId: "ocp.notification",
      interruptClass: "remote",
    });
    expect(descriptor).not.toHaveProperty("durationMs");
  });

  it("omits id when OCP id empty so softphone can generate one", () => {
    const descriptor = mapOcpNotificationToToastDescriptor(
      basePayload({ id: "  ", type: "error", body: "No id" }),
    );

    expect(descriptor).toEqual({
      level: "error",
      messageText: "No id",
      module: "ocp",
      functionId: "ocp.notification",
      interruptClass: "remote",
    });
    expect(descriptor).not.toHaveProperty("id");
  });
});

import { describe, expect, it } from "vitest";
import { mapOcpNotificationToToastDescriptor } from "./createOcpToastNotificationPresenter.js";

describe("mapOcpNotificationToToastDescriptor", () => {
  it("maps error payload to toast descriptor", () => {
    const descriptor = mapOcpNotificationToToastDescriptor({
      id: "n1",
      uuid: undefined,
      type: "error",
      body: "OCP failed",
      time: 1,
      blocked: false,
      deleted: false,
      position: "top-right",
    });

    expect(descriptor).toEqual({
      id: "ocp-notification-n1",
      level: "error",
      messageText: "OCP failed",
    });
  });

  it("skips deleted and empty payloads; sticky uses infinite duration", () => {
    expect(
      mapOcpNotificationToToastDescriptor({
        id: "n2",
        uuid: undefined,
        type: "notify",
        body: "x",
        time: 1,
        blocked: false,
        deleted: true,
        position: "top-right",
      }),
    ).toBeNull();

    expect(
      mapOcpNotificationToToastDescriptor({
        id: "n3",
        uuid: undefined,
        type: "notify",
        body: "   ",
        time: 1,
        blocked: false,
        deleted: false,
        position: "center",
      }),
    ).toBeNull();

    expect(
      mapOcpNotificationToToastDescriptor({
        id: "n4",
        uuid: undefined,
        type: "success",
        body: "Sticky",
        time: 1,
        blocked: false,
        deleted: false,
        sticky: true,
        position: "top-left",
      }),
    ).toMatchObject({
      level: "success",
      messageText: "Sticky",
      durationMs: 0,
    });
  });
});

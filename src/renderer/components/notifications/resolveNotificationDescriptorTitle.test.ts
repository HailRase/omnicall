import { describe, expect, it } from "vitest";
import { resolveNotificationDescriptorTitle } from "./resolveNotificationDescriptorTitle.js";

describe("resolveNotificationDescriptorTitle", () => {
  it("interpolates reserved toast reason params", () => {
    const title = resolveNotificationDescriptorTitle(
      {
        level: "success",
        messageKey: "ocp.status.reservedToast",
        messageParams: { reason: "Обед" },
      },
      "ru",
    );
    expect(title).toBe("Вы зарезервировали статус «Обед» после звонка");
  });

  it("does not throw when interpolated params are omitted", () => {
    expect(() =>
      resolveNotificationDescriptorTitle(
        {
          level: "success",
          messageKey: "ocp.status.reservedToast",
        },
        "ru",
      ),
    ).not.toThrow();
  });

  it("prefers messageText over messageKey", () => {
    const title = resolveNotificationDescriptorTitle(
      {
        level: "info",
        messageKey: "ocp.status.reservedToast",
        messageParams: { reason: "Обед" },
        messageText: "Plain text",
      },
      "ru",
    );
    expect(title).toBe("Plain text");
  });
});

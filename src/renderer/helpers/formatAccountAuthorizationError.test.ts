import { describe, expect, it } from "vitest";
import { setRendererLanguage, translateCurrent } from "../i18n/runtime.js";
import { formatAccountAuthorizationError } from "./formatAccountAuthorizationError.js";

describe("formatAccountAuthorizationError", () => {
  it("passes detail into serverRegistration message", () => {
    setRendererLanguage("ru");
    expect(
      formatAccountAuthorizationError(translateCurrent, {
        key: "account.error.serverRegistration",
        params: { detail: "403 Forbidden" },
      }),
    ).toBe("Ошибка регистрации на сервере: 403 Forbidden");
  });

  it("does not throw when serverRegistration params are missing", () => {
    setRendererLanguage("ru");
    expect(
      formatAccountAuthorizationError(translateCurrent, {
        key: "account.error.serverRegistration",
      }),
    ).toBe("Ошибка регистрации на сервере: ");
  });

  it("translates keys without params", () => {
    setRendererLanguage("ru");
    expect(
      formatAccountAuthorizationError(translateCurrent, {
        key: "account.error.invalidCredentials",
      }),
    ).toBe("Неверный логин или пароль");
  });
});

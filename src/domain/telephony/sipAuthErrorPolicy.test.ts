import { describe, expect, it } from "vitest";
import {
  formatSipAuthTerminalMessage,
  isNonRetryableSipAuthError,
  isNonRetryableSipAuthHttpCode,
  isNonRetryableSipRegistrationFailureKey,
} from "./sipAuthErrorPolicy.js";

describe("sipAuthErrorPolicy", () => {
  it("detects 401 and 403 as non-retryable HTTP codes", () => {
    expect(isNonRetryableSipAuthHttpCode(401)).toBe(true);
    expect(isNonRetryableSipAuthHttpCode(403)).toBe(true);
    expect(isNonRetryableSipAuthHttpCode(404)).toBe(false);
  });

  it("detects authentication_error and forbidden reason keys", () => {
    expect(isNonRetryableSipRegistrationFailureKey("authentication_error")).toBe(true);
    expect(isNonRetryableSipRegistrationFailureKey("forbidden")).toBe(true);
    expect(isNonRetryableSipRegistrationFailureKey("registration_timeout")).toBe(false);
  });

  it("classifies auth errors from code or raw text", () => {
    expect(isNonRetryableSipAuthError(401)).toBe(true);
    expect(isNonRetryableSipAuthError(null, "SIP failure code 403 Forbidden")).toBe(true);
    expect(isNonRetryableSipAuthError(null, "registration timeout")).toBe(false);
  });

  it("formats Russian terminal auth message", () => {
    expect(formatSipAuthTerminalMessage(401, "Authentication Error")).toContain(
      "Переподключение прервано",
    );
    expect(formatSipAuthTerminalMessage(401, "Authentication Error")).toContain(
      "Проверьте логин/пароль",
    );
  });
});

import { describe, expect, it } from "vitest";
import { createPlatformError } from "@shared/errors/index.js";
import { mapAccountAuthorizationError } from "./mapAccountAuthorizationError.js";
import { LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE } from "./isLocalSavedProfileNotFoundError.js";
import { sanitizeRegistrationServerMessage } from "./sanitizeRegistrationServerMessage.js";

describe("mapAccountAuthorizationError", () => {
  it("maps local saved profile not_found to profileNotFound", () => {
    expect(
      mapAccountAuthorizationError(
        createPlatformError("not_found", LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE),
      ),
    ).toEqual({ key: "account.error.profileNotFound" });
  });

  it("maps validation_failed to validationFailed", () => {
    expect(
      mapAccountAuthorizationError(
        createPlatformError("validation_failed", "Access denied: username is required"),
      ),
    ).toEqual({ key: "account.error.validationFailed" });
  });

  it("maps unauthorized to invalidCredentials", () => {
    expect(
      mapAccountAuthorizationError(createPlatformError("unauthorized", "Unauthorized")),
    ).toEqual({ key: "account.error.invalidCredentials" });
  });

  it("maps SIP 403 forbidden to server registration detail, not invalid credentials", () => {
    const mapped = mapAccountAuthorizationError(
      createPlatformError("operation_failed", "SIP registration failed: Forbidden"),
    );
    expect(mapped.key).toBe("account.error.serverRegistration");
    expect(mapped.params?.detail).toContain("Forbidden");
  });

  it("maps SIP 404 not found to server registration detail, not profileNotFound", () => {
    const mapped = mapAccountAuthorizationError(
      createPlatformError("operation_failed", "SIP registration failed: Not Found"),
    );
    expect(mapped.key).toBe("account.error.serverRegistration");
    expect(mapped.params?.detail).not.toBe("account.error.profileNotFound");
  });

  it("maps SIP authentication failures to invalidCredentials", () => {
    expect(
      mapAccountAuthorizationError(
        createPlatformError(
          "operation_failed",
          "SIP registration failed for reregister: Authentication Error",
        ),
      ).key,
    ).toBe("account.error.invalidCredentials");
  });

  it("maps timeout and transport failures to networkOrTransport", () => {
    expect(
      mapAccountAuthorizationError(createPlatformError("timeout", "Timed out")).key,
    ).toBe("account.error.networkOrTransport");
    expect(
      mapAccountAuthorizationError(
        createPlatformError("operation_failed", "transport connection timed out"),
      ).key,
    ).toBe("account.error.networkOrTransport");
  });

  it("sanitizes server messages and never returns password fragments", () => {
    const sanitized = sanitizeRegistrationServerMessage(
      "authentication failed for user secret-password-value",
    );
    expect(sanitized).toBe("Server registration failed");
    expect(sanitized.toLowerCase()).not.toContain("password");
  });
});

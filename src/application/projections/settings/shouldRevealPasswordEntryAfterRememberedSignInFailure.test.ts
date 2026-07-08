import { describe, expect, it } from "vitest";
import { createPlatformError } from "@shared/errors/index.js";
import { shouldRevealPasswordEntryAfterRememberedSignInFailure } from "./shouldRevealPasswordEntryAfterRememberedSignInFailure.js";

describe("shouldRevealPasswordEntryAfterRememberedSignInFailure", () => {
  it("returns false for SIP 403 forbidden registration failures", () => {
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError(
          "operation_failed",
          "SIP registration failed: 403 Rejected (forbidden)",
        ),
      ),
    ).toBe(false);
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("forbidden", "SIP registration rejected"),
      ),
    ).toBe(false);
  });

  it("returns false for SIP 404 not found registration failures", () => {
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("operation_failed", "SIP registration failed: Not Found"),
      ),
    ).toBe(false);
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("not_found", "SIP registration endpoint not found"),
      ),
    ).toBe(false);
  });

  it("returns false for timeout and network transport failures", () => {
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("timeout", "Registration timed out"),
      ),
    ).toBe(false);
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("operation_failed", "transport connection timed out"),
      ),
    ).toBe(false);
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("operation_failed", "connection error"),
      ),
    ).toBe(false);
  });

  it("returns false for generic server registration failures", () => {
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("operation_failed", "SIP registration failed"),
      ),
    ).toBe(false);
  });

  it("returns true for unauthorized platform errors", () => {
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("unauthorized", "Unauthorized"),
      ),
    ).toBe(true);
  });

  it("returns true for SIP authentication errors", () => {
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError(
          "operation_failed",
          "SIP registration failed for user: Authentication Error",
        ),
      ),
    ).toBe(true);
  });

  it("returns true for missing remembered password validation errors", () => {
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("validation_failed", "SIP password is required"),
      ),
    ).toBe(true);
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("validation_failed", "Access denied: username is required"),
      ),
    ).toBe(false);
  });

  it("returns true for local secret storage load failures", () => {
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("unknown", "secret_load_failed"),
      ),
    ).toBe(true);
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("unknown", "encryption_unavailable"),
      ),
    ).toBe(true);
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("unknown", "invalid_secret_storage_response"),
      ),
    ).toBe(true);
    expect(
      shouldRevealPasswordEntryAfterRememberedSignInFailure(
        createPlatformError("unknown", "secret_storage_error"),
      ),
    ).toBe(true);
  });
});

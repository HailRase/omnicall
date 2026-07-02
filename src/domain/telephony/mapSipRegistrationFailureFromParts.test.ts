import { describe, expect, it } from "vitest";
import { mapSipRegistrationFailureFromParts } from "./mapSipRegistrationFailureFromParts.js";

describe("mapSipRegistrationFailureFromParts", () => {
  it("maps 403 Rejected to forbidden", () => {
    expect(mapSipRegistrationFailureFromParts("Rejected", 403)).toBe("forbidden");
  });

  it("maps 401 to authentication_error", () => {
    expect(mapSipRegistrationFailureFromParts("Authentication Error", 401)).toBe(
      "authentication_error",
    );
  });

  it("falls back to text mapping when status code is absent", () => {
    expect(mapSipRegistrationFailureFromParts("Authentication Error", null)).toBe(
      "authentication_error",
    );
    expect(mapSipRegistrationFailureFromParts("Connection Error", null)).toBe(
      "connection_error",
    );
  });
});

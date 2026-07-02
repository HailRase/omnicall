import { describe, expect, it } from "vitest";
import { extractJsSipRegistrationFailureParts } from "./extractJsSipRegistrationFailureParts.js";

describe("extractJsSipRegistrationFailureParts", () => {
  it("extracts cause and status code from JsSIP registrationFailed event", () => {
    expect(
      extractJsSipRegistrationFailureParts({
        cause: "Rejected",
        response: { status_code: 403, reason_phrase: "Forbidden" },
      }),
    ).toEqual({
      cause: "Rejected",
      statusCode: 403,
    });
  });

  it("returns null status code when response is missing", () => {
    expect(
      extractJsSipRegistrationFailureParts({
        cause: "Authentication Error",
      }),
    ).toEqual({
      cause: "Authentication Error",
      statusCode: null,
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  extractContactValidationErrors,
  mapContactValidationError,
  mapContactValidationErrorsByField,
} from "./mapContactValidationErrors.js";

describe("mapContactValidationErrors", () => {
  it("maps validation codes to i18n keys", () => {
    expect(mapContactValidationError("display_name_required")).toBe(
      "contacts.field.error.displayNameRequired",
    );
    expect(mapContactValidationError("primary_phone_invalid")).toBe(
      "contacts.field.error.primaryPhoneInvalid",
    );
  });

  it("extracts validation codes from cause arrays", () => {
    expect(
      extractContactValidationErrors(["display_name_required", "unknown", "notes_too_long"]),
    ).toEqual(["display_name_required", "notes_too_long"]);
  });

  it("groups field errors by form field", () => {
    expect(
      mapContactValidationErrorsByField([
        "display_name_required",
        "primary_phone_invalid",
        "display_name_too_long",
      ]),
    ).toEqual({
      displayName: "contacts.field.error.displayNameRequired",
      primaryPhone: "contacts.field.error.primaryPhoneInvalid",
    });
  });
});

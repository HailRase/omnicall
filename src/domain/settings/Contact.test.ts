import { describe, expect, it } from "vitest";
import { createContact, updateContact, validateContactPhoneUniqueness } from "./Contact.js";
import { createContactId } from "./ContactId.js";

const validInput = {
  displayName: "Alex Supervisor",
  primaryPhone: "+12025550100",
  secondaryPhone: "1001",
  company: "SoftOmniTel",
  notes: "VIP",
} as const;

describe("createContact", () => {
  it("creates a normalized contact with generated id", () => {
    const result = createContact(validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.displayName).toBe("Alex Supervisor");
    expect(result.value.primaryPhone).toBe("+12025550100");
    expect(result.value.secondaryPhone).toBe("1001");
    expect(result.value.company).toBe("SoftOmniTel");
    expect(result.value.notes).toBe("VIP");
    expect(result.value.id).toMatch(/^contact_/);
  });

  it("rejects empty display name", () => {
    const result = createContact({ ...validInput, displayName: "   " });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errors).toContain("display_name_required");
  });

  it("rejects invalid primary phone", () => {
    const result = createContact({ ...validInput, primaryPhone: "abc" });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errors).toContain("primary_phone_invalid");
  });

  it("allows omitted optional fields", () => {
    const result = createContact({
      displayName: "Support",
      primaryPhone: "100",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.secondaryPhone).toBeNull();
    expect(result.value.company).toBeNull();
    expect(result.value.notes).toBeNull();
  });
});

describe("updateContact", () => {
  it("updates mutable fields and preserves id", () => {
    const contactId = createContactId("agent-1");
    expect(contactId).not.toBeNull();
    if (contactId === null) {
      return;
    }

    const created = createContact(validInput, { id: contactId });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const updated = updateContact(created.value, {
      displayName: "Alex S.",
      secondaryPhone: null,
      notes: null,
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) {
      return;
    }

    expect(updated.value.id).toBe("agent-1");
    expect(updated.value.displayName).toBe("Alex S.");
    expect(updated.value.secondaryPhone).toBeNull();
    expect(updated.value.notes).toBeNull();
    expect(updated.value.updatedAt >= created.value.updatedAt).toBe(true);
  });
});

describe("createContactId", () => {
  it("accepts route-compatible ids", () => {
    expect(createContactId("agent-1")).toBe("agent-1");
  });

  it("rejects invalid ids", () => {
    expect(createContactId("bad id")).toBeNull();
    expect(createContactId("")).toBeNull();
  });
});

describe("validateContactPhoneUniqueness", () => {
  it("rejects duplicate primary phone against existing contact primary", () => {
    const existing = createContact(validInput);
    expect(existing.ok).toBe(true);
    if (!existing.ok) {
      return;
    }

    const errors = validateContactPhoneUniqueness(
      { primaryPhone: "+12025550100", secondaryPhone: null },
      [existing.value],
    );

    expect(errors).toContain("primary_phone_duplicate");
  });

  it("rejects duplicate secondary phone against existing contact phones", () => {
    const existing = createContact(validInput);
    expect(existing.ok).toBe(true);
    if (!existing.ok) {
      return;
    }

    const errors = validateContactPhoneUniqueness(
      { primaryPhone: "1002", secondaryPhone: "1001" },
      [existing.value],
    );

    expect(errors).toContain("secondary_phone_duplicate");
  });

  it("allows updating the same contact without duplicate errors", () => {
    const existing = createContact(validInput);
    expect(existing.ok).toBe(true);
    if (!existing.ok) {
      return;
    }

    const errors = validateContactPhoneUniqueness(
      { primaryPhone: existing.value.primaryPhone, secondaryPhone: existing.value.secondaryPhone },
      [existing.value],
      existing.value.id,
    );

    expect(errors).toEqual([]);
  });
});

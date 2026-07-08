import { createContact } from "@domain/settings/Contact.js";
import { createContactId } from "@domain/settings/ContactId.js";
import { describe, expect, it } from "vitest";
import {
  buildContactDirectory,
} from "./contactDirectory.js";

function buildContact(
  id: string,
  displayName: string,
  primaryPhone: string,
  secondaryPhone: string | null = null,
) {
  const contactId = createContactId(id);
  if (contactId === null) {
    throw new Error("invalid contact id");
  }

  const created = createContact(
    {
      displayName,
      primaryPhone,
      ...(secondaryPhone !== null ? { secondaryPhone } : {}),
    },
    { id: contactId },
  );
  if (!created.ok) {
    throw new Error("invalid contact");
  }

  return created.value;
}

describe("contactDirectory", () => {
  it("matches primary phone and prefers contact display name", () => {
    const directory = buildContactDirectory([
      buildContact("agent-a", "Alice Agent", "+12025550100"),
    ]);

    const presentation = directory.resolvePresentation({
      remoteNumber: "+1 (202) 555-0100",
      displayLabel: "SIP Alice",
    });

    expect(presentation).toEqual({
      primaryLabel: "Alice Agent",
      secondaryLabel: "+12025550100",
      contactId: "agent-a",
      source: "contact",
    });
  });

  it("matches secondary phone when primary does not match", () => {
    const directory = buildContactDirectory([
      buildContact("agent-b", "Bob Backup", "+12025550111", "1001"),
    ]);

    const presentation = directory.resolvePresentation({
      remoteNumber: "1001",
      displayLabel: null,
    });

    expect(presentation.source).toBe("contact");
    expect(presentation.primaryLabel).toBe("Bob Backup");
    expect(presentation.contactId).toBe("agent-b");
  });

  it("falls back to SIP label when no contact matches and label differs from number", () => {
    const directory = buildContactDirectory([]);

    const presentation = directory.resolvePresentation({
      remoteNumber: "+12025550122",
      displayLabel: "Support Queue",
    });

    expect(presentation).toEqual({
      primaryLabel: "Support Queue",
      secondaryLabel: "+12025550122",
      contactId: null,
      source: "sip",
    });
  });

  it("falls back to normalized number when SIP label equals the number", () => {
    const directory = buildContactDirectory([]);

    const presentation = directory.resolvePresentation({
      remoteNumber: "+12025550133",
      displayLabel: "+1 202 555 0133",
    });

    expect(presentation).toEqual({
      primaryLabel: "+12025550133",
      secondaryLabel: null,
      contactId: null,
      source: "number",
    });
  });

  it("returns unknown presentation when no number or label is usable", () => {
    const directory = buildContactDirectory([]);

    const presentation = directory.resolvePresentation({
      remoteNumber: "   ",
      displayLabel: null,
    });

    expect(presentation).toEqual({
      primaryLabel: "",
      secondaryLabel: null,
      contactId: null,
      source: "unknown",
    });
  });

  it("prefers primary-phone owner over secondary-phone owner for duplicate numbers", () => {
    const directory = buildContactDirectory([
      buildContact("agent-secondary", "Secondary Owner", "+12025550999", "+12025550144"),
      buildContact("agent-primary", "Primary Owner", "+12025550144"),
    ]);

    const presentation = directory.resolvePresentation({
      remoteNumber: "+12025550144",
      displayLabel: null,
    });

    expect(presentation.source).toBe("contact");
    expect(presentation.primaryLabel).toBe("Primary Owner");
    expect(presentation.contactId).toBe("agent-primary");
  });

  it("uses stable contact id ordering when duplicate fallback priorities tie", () => {
    const directory = buildContactDirectory([
      buildContact("agent-z", "Zulu", "+12025550155"),
      buildContact("agent-a", "Alpha", "+12025550155"),
    ]);

    const presentation = directory.resolvePresentation({
      remoteNumber: "+12025550155",
      displayLabel: null,
    });

    expect(presentation.contactId).toBe("agent-a");
    expect(presentation.primaryLabel).toBe("Alpha");
  });
});

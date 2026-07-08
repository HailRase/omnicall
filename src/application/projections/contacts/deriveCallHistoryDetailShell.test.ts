import { describe, expect, it } from "vitest";
import { createCallId } from "@domain/index.js";
import { createContact } from "@domain/settings/Contact.js";
import { createContactId } from "@domain/settings/ContactId.js";
import { createCallHistoryEntryFromSession } from "@domain/settings/CallHistoryEntry.js";
import { initialMultiCallProjection } from "../telephony/multiCallProjection.js";
import { deriveCallHistoryDetailShell } from "./deriveCallHistoryDetailShell.js";

function buildContact(id: string, displayName: string, primaryPhone: string) {
  const contactId = createContactId(id);
  if (contactId === null) {
    throw new Error("invalid contact id");
  }

  const created = createContact({ displayName, primaryPhone }, { id: contactId });
  if (!created.ok) {
    throw new Error("invalid contact");
  }

  return created.value;
}

function createEntry(remoteNumber: string, displayLabel: string | null) {
  const created = createCallHistoryEntryFromSession({
    callId: createCallId("call-detail-test"),
    direction: "incoming",
    remoteNumber,
    displayLabel,
    startedAt: "2026-07-07T10:00:00.000Z",
    endedAt: "2026-07-07T10:01:30.000Z",
    wasAnswered: true,
    failed: false,
    missedBeforeAnswer: false,
  });
  if (!created.ok) {
    throw new Error("expected valid entry");
  }
  return created.value;
}

describe("deriveCallHistoryDetailShell", () => {
  it("enriches detail labels from matching contact", () => {
    const contact = buildContact("contact-1", "Alice", "+12025550147");
    const detail = deriveCallHistoryDetailShell({
      entry: createEntry("+12025550147", "SIP Alice"),
      contacts: [contact],
      isSipRegistered: true,
      multiCallProjection: initialMultiCallProjection(),
    });

    expect(detail.primaryLabel).toBe("Alice");
    expect(detail.contactId).toBe(contact.id);
    expect(detail.presentationSource).toBe("contact");
    expect(detail.durationSec).toBe(90);
  });

  it("exposes redial disabled reason when SIP is not registered", () => {
    const detail = deriveCallHistoryDetailShell({
      entry: createEntry("+12025550147", null),
      contacts: [],
      isSipRegistered: false,
      multiCallProjection: initialMultiCallProjection(),
    });

    expect(detail.redialDisabledReasonKey).toBe("history.redial.disabled.notRegistered");
  });
});

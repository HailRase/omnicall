import { describe, expect, it } from "vitest";
import { createContactId } from "@domain/index.js";
import { initialContactsProjection } from "./contactsProjection.js";
import { deriveContactsShell } from "./deriveContactsShell.js";
import { initialMultiCallProjection } from "./multiCallProjection.js";

describe("deriveContactsShell", () => {
  it("marks call disabled when SIP is not registered", () => {
    const contactId = createContactId("agent-1");
    expect(contactId).not.toBeNull();
    if (contactId === null) {
      return;
    }

    const shell = deriveContactsShell({
      projection: {
        ...initialContactsProjection(),
        status: "populated",
        contacts: [
          {
            id: contactId,
            displayName: "Alex",
            primaryPhone: "+12025550100",
            secondaryPhone: null,
            company: null,
            notes: null,
            createdAt: "2026-07-07T10:00:00.000Z",
            updatedAt: "2026-07-07T10:00:00.000Z",
          },
        ],
      },
      isSipRegistered: false,
      multiCallProjection: initialMultiCallProjection(),
    });

    expect(shell.contacts[0]?.callDisabledReasonKey).toBe(
      "contacts.call.disabled.notRegistered",
    );
  });

  it("marks call disabled during active call when multi-sessions are off", () => {
    const contactId = createContactId("agent-2");
    expect(contactId).not.toBeNull();
    if (contactId === null) {
      return;
    }

    const shell = deriveContactsShell({
      projection: {
        ...initialContactsProjection(),
        status: "populated",
        contacts: [
          {
            id: contactId,
            displayName: "Bravo",
            primaryPhone: "+12025550101",
            secondaryPhone: null,
            company: null,
            notes: null,
            createdAt: "2026-07-07T10:00:00.000Z",
            updatedAt: "2026-07-07T10:00:00.000Z",
          },
        ],
      },
      isSipRegistered: true,
      multiCallProjection: {
        ...initialMultiCallProjection(),
        hasEstablishedCall: true,
        establishedCallCount: 1,
        multiSessionsEnabled: false,
      },
    });

    expect(shell.contacts[0]?.callDisabledReasonKey).toBe(
      "contacts.call.disabled.activeCallPolicy",
    );
  });
});

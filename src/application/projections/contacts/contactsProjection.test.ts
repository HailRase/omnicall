import { describe, expect, it } from "vitest";
import { createContactId } from "@domain/index.js";
import { createContactCreatedEvent, createContactDeletedEvent } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  applyContactsLoaded,
  initialContactsProjection,
  reduceContactsProjection,
} from "./contactsProjection.js";

describe("contactsProjection", () => {
  it("loads and mutates contacts through domain events", () => {
    const contact = {
      id: createContactId("agent-1")!,
      displayName: "Alex",
      primaryPhone: "+12025550100",
      secondaryPhone: null,
      company: null,
      notes: null,
      createdAt: "2026-07-07T10:00:00.000Z",
      updatedAt: "2026-07-07T10:00:00.000Z",
    };

    const loaded = applyContactsLoaded(initialContactsProjection(), [contact]);
    expect(loaded.status).toBe("populated");
    expect(loaded.contacts).toHaveLength(1);

    const created = reduceContactsProjection(
      loaded,
      createContactCreatedEvent(createCorrelationId(), {
        ...contact,
        id: createContactId("agent-2")!,
        displayName: "Bravo",
      }),
    );
    expect(created.contacts).toHaveLength(2);

    const deleted = reduceContactsProjection(
      created,
      createContactDeletedEvent(createCorrelationId(), contact.id),
    );
    expect(deleted.contacts).toHaveLength(1);
    expect(deleted.contacts[0]?.id).toBe("agent-2");
  });
});

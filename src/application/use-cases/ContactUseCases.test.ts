import { describe, expect, it } from "vitest";
import { InMemoryContactRepository } from "@adapters/settings/InMemoryContactRepository.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";
import { CreateContactUseCase } from "./CreateContactUseCase.js";
import { DeleteContactUseCase } from "./DeleteContactUseCase.js";
import { GetContactUseCase } from "./GetContactUseCase.js";
import { ListContactsUseCase } from "./ListContactsUseCase.js";
import { UpdateContactUseCase } from "./UpdateContactUseCase.js";

const sampleInput = {
  displayName: "Alex Agent",
  primaryPhone: "+12025550100",
} as const;

describe("Contact Use Cases", () => {
  it("creates, lists, gets, updates, and deletes contacts", async () => {
    const repository = new InMemoryContactRepository();
    const eventPublisher = new InMemoryDomainEventBus();
    const logger = createTestLogger();
    const createUseCase = new CreateContactUseCase(repository, eventPublisher, logger);
    const listUseCase = new ListContactsUseCase(repository, logger);
    const getUseCase = new GetContactUseCase(repository, logger);
    const updateUseCase = new UpdateContactUseCase(repository, eventPublisher, logger);
    const deleteUseCase = new DeleteContactUseCase(repository, eventPublisher, logger);

    const created = await createUseCase.execute({ contact: sampleInput });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const listed = await listUseCase.execute();
    expect(listed.ok).toBe(true);
    if (!listed.ok) {
      return;
    }
    expect(listed.value).toHaveLength(1);

    const loaded = await getUseCase.execute({ contactId: created.value.id });
    expect(loaded.ok).toBe(true);

    const updated = await updateUseCase.execute({
      contactId: created.value.id,
      update: { displayName: "Alex Updated" },
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) {
      return;
    }
    expect(updated.value.displayName).toBe("Alex Updated");

    const deleted = await deleteUseCase.execute({ contactId: created.value.id });
    expect(deleted.ok).toBe(true);
    expect(await repository.listContacts()).toHaveLength(0);
  });

  it("returns not_found for missing contact", async () => {
    const repository = new InMemoryContactRepository();
    const getUseCase = new GetContactUseCase(repository, createTestLogger());
    const result = await getUseCase.execute({ contactId: "missing-id" });
    expect(isErr(result)).toBe(true);
  });

  it("rejects invalid contact id", async () => {
    const repository = new InMemoryContactRepository();
    const getUseCase = new GetContactUseCase(repository, createTestLogger());
    const result = await getUseCase.execute({ contactId: "bad id" });
    expect(isErr(result)).toBe(true);
  });
});

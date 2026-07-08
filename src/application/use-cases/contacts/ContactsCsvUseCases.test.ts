import { describe, expect, it } from "vitest";
import { InMemoryContactRepository } from "@adapters/settings/InMemoryContactRepository.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";
import { CONTACT_CSV_CANONICAL_HEADER } from "../../import-export/ContactCsvCodec.js";
import { CreateContactUseCase } from "./CreateContactUseCase.js";
import { ExportContactsCsvUseCase } from "./ExportContactsCsvUseCase.js";
import { ImportContactsCsvUseCase } from "./ImportContactsCsvUseCase.js";

describe("Contacts CSV Use Cases", () => {
  it("imports valid rows, skips duplicates, and reports validation failures", async () => {
    const repository = new InMemoryContactRepository();
    const eventPublisher = new InMemoryDomainEventBus();
    const logger = createTestLogger();
    const createUseCase = new CreateContactUseCase(repository, eventPublisher, logger);
    const importUseCase = new ImportContactsCsvUseCase(repository, createUseCase, logger);

    await createUseCase.execute({
      contact: {
        displayName: "Existing Contact",
        primaryPhone: "+12025550100",
      },
    });

    const csv = [
      CONTACT_CSV_CANONICAL_HEADER,
      "New Contact,+12025550101,,,",
      "Duplicate Contact,+12025550100,,,",
      ",invalid-phone,,,",
      "Second New,+12025550102,,,",
    ].join("\n");

    const result = await importUseCase.execute({ csvContents: csv });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.createdCount).toBe(2);
    expect(result.value.skippedDuplicateCount).toBe(1);
    expect(result.value.failedRows).toHaveLength(1);
    expect(await repository.listContacts()).toHaveLength(3);
  });

  it("rejects unsafe CSV structure before mutating contacts", async () => {
    const repository = new InMemoryContactRepository();
    const eventPublisher = new InMemoryDomainEventBus();
    const logger = createTestLogger();
    const createUseCase = new CreateContactUseCase(repository, eventPublisher, logger);
    const importUseCase = new ImportContactsCsvUseCase(repository, createUseCase, logger);

    const result = await importUseCase.execute({ csvContents: '"unclosed field' });
    expect(isErr(result)).toBe(true);
    expect(await repository.listContacts()).toHaveLength(0);
  });

  it("exports current account contacts with canonical header", async () => {
    const repository = new InMemoryContactRepository();
    const eventPublisher = new InMemoryDomainEventBus();
    const logger = createTestLogger();
    const createUseCase = new CreateContactUseCase(repository, eventPublisher, logger);
    const exportUseCase = new ExportContactsCsvUseCase(repository, logger);

    await createUseCase.execute({
      contact: {
        displayName: "Alex Agent",
        primaryPhone: "+12025550100",
        company: "Axatalk",
      },
    });

    const result = await exportUseCase.execute();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.contactCount).toBe(1);
    expect(result.value.csvContents.startsWith(`${CONTACT_CSV_CANONICAL_HEADER}\n`)).toBe(true);
    expect(result.value.csvContents).toContain("Alex Agent,+12025550100,,Axatalk,");
  });
});

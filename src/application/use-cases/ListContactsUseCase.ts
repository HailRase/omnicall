import type { Contact } from "@domain/index.js";
import type { ContactRepository, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type ListContactsInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: load persisted local contacts for renderer projection.
 * - Inputs: optional correlation id for observability.
 * - Outputs: display-name-sorted contacts.
 */
export class ListContactsUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ListContactsInput = {},
  ): Promise<Result<ReadonlyArray<Contact>, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const contacts = await this.contactRepository.listContacts();

    this.logger.info("contacts_listed", {
      correlationId,
      featureId: "F-025",
      boundedContext: "Settings",
      operation: "list_contacts",
      result: "succeeded",
      count: contacts.length,
    });

    return ok(contacts);
  }
}

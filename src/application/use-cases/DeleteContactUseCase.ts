import {
  createContactId,
  createContactDeletedEvent,
} from "@domain/index.js";
import type { ContactRepository, DomainEventPublisher, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type DeleteContactInput = Readonly<{
  contactId: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: remove a local contact by id.
 * - Inputs: contact id string.
 * - Outputs: void result and ContactDeleted event publication.
 */
export class DeleteContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(input: DeleteContactInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const contactId = createContactId(input.contactId);
    if (contactId === null) {
      return err(createPlatformError("validation_failed", "Invalid contact id"));
    }

    const deleted = await this.contactRepository.deleteContact(contactId);
    if (!deleted) {
      this.logger.warn("contact_delete_not_found", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "delete_contact",
        contactId: input.contactId,
        result: "not_found",
      });
      return err(createPlatformError("not_found", "Contact was not found"));
    }

    this.eventPublisher.publish(createContactDeletedEvent(correlationId, contactId));

    this.logger.info("contact_deleted", {
      correlationId,
      featureId: "F-025",
      boundedContext: "Settings",
      operation: "delete_contact",
      contactId,
      result: "succeeded",
    });

    return ok(undefined);
  }
}

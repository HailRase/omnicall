import {
  createContact,
  createContactCreatedEvent,
  type Contact,
  type ContactInput,
} from "@domain/index.js";
import type { ContactRepository, DomainEventPublisher, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type CreateContactInput = Readonly<{
  contact: ContactInput;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: validate and persist a new local contact.
 * - Inputs: contact input fields.
 * - Outputs: stored Contact and ContactCreated event publication.
 */
export class CreateContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(input: CreateContactInput): Promise<Result<Contact, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const validation = createContact(input.contact);
    if (!validation.ok) {
      return err(
        createPlatformError(
          "validation_failed",
          "Invalid contact input",
          validation.errors,
        ),
      );
    }

    try {
      const saved = await this.contactRepository.createContact(input.contact);
      this.eventPublisher.publish(createContactCreatedEvent(correlationId, saved));

      this.logger.info("contact_created", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "create_contact",
        contactId: saved.id,
        result: "succeeded",
      });

      return ok(saved);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error("contact_create_failed", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "create_contact",
        result: normalized.code,
      });
      return err(normalized);
    }
  }
}

import {
  createContactId,
  createContactUpdatedEvent,
  updateContact,
  type Contact,
  type ContactUpdateInput,
  validateContactPhoneUniqueness,
} from "@domain/index.js";
import type { ContactRepository, DomainEventPublisher, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type UpdateContactInput = Readonly<{
  contactId: string;
  update: ContactUpdateInput;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: validate and persist contact field updates.
 * - Inputs: contact id and partial update fields.
 * - Outputs: updated Contact and ContactUpdated event publication.
 */
export class UpdateContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(input: UpdateContactInput): Promise<Result<Contact, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const contactId = createContactId(input.contactId);
    if (contactId === null) {
      return err(createPlatformError("validation_failed", "Invalid contact id"));
    }

    try {
      const existing = await this.contactRepository.getContactById(contactId);
      if (existing === null) {
        this.logger.warn("contact_update_not_found", {
          correlationId,
          featureId: "F-025",
          boundedContext: "Settings",
          operation: "update_contact",
          contactId: input.contactId,
          result: "not_found",
        });
        return err(createPlatformError("not_found", "Contact was not found"));
      }

      const validation = updateContact(existing, input.update);
      if (!validation.ok) {
        return err(
          createPlatformError(
            "validation_failed",
            "Invalid contact input",
            validation.errors,
          ),
        );
      }

      const existingContacts = await this.contactRepository.listContacts();
      const uniquenessErrors = validateContactPhoneUniqueness(
        {
          primaryPhone: validation.value.primaryPhone,
          secondaryPhone: validation.value.secondaryPhone,
        },
        existingContacts,
        contactId,
      );
      if (uniquenessErrors.length > 0) {
        return err(
          createPlatformError(
            "validation_failed",
            "Invalid contact input",
            uniquenessErrors,
          ),
        );
      }

      const updated = await this.contactRepository.updateContact(contactId, input.update);
      if (updated === null) {
        this.logger.warn("contact_update_not_found", {
          correlationId,
          featureId: "F-025",
          boundedContext: "Settings",
          operation: "update_contact",
          contactId: input.contactId,
          result: "not_found",
        });
        return err(createPlatformError("not_found", "Contact was not found"));
      }

      this.eventPublisher.publish(createContactUpdatedEvent(correlationId, updated));

      this.logger.info("contact_updated", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "update_contact",
        contactId: updated.id,
        result: "succeeded",
      });

      return ok(updated);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error("contact_update_failed", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "update_contact",
        contactId: input.contactId,
        result: normalized.code,
      });
      return err(normalized);
    }
  }
}

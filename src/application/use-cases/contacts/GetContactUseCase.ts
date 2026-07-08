import { createContactId, type Contact } from "@domain/index.js";
import type { ContactRepository, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type GetContactInput = Readonly<{
  contactId: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: load one local contact by id.
 * - Inputs: contact id string.
 * - Outputs: Contact snapshot or not_found/validation error.
 */
export class GetContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: GetContactInput): Promise<Result<Contact, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const contactId = createContactId(input.contactId);
    if (contactId === null) {
      return err(createPlatformError("validation_failed", "Invalid contact id"));
    }

    const contact = await this.contactRepository.getContactById(contactId);
    if (contact === null) {
      this.logger.warn("contact_not_found", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "get_contact",
        contactId: input.contactId,
        result: "not_found",
      });
      return err(createPlatformError("not_found", "Contact was not found"));
    }

    this.logger.info("contact_loaded", {
      correlationId,
      featureId: "F-025",
      boundedContext: "Settings",
      operation: "get_contact",
      contactId: contact.id,
      result: "succeeded",
    });

    return ok(contact);
  }
}

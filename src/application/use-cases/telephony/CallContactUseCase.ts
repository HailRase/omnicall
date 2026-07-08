import { createContactId, type Call } from "@domain/index.js";
import type { ContactRepository, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { MakeCallUseCase } from "./MakeCallUseCase.js";

export type CallContactInput = Readonly<{
  contactId: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: initiate outgoing call to a contact primary phone.
 * - Inputs: contact id string.
 * - Outputs: resulting Call snapshot via MakeCallUseCase.
 */
export class CallContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly makeCallUseCase: MakeCallUseCase,
    private readonly logger: Logger,
  ) {}

  async execute(input: CallContactInput): Promise<Result<Call, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const contactId = createContactId(input.contactId);
    if (contactId === null) {
      return err(createPlatformError("validation_failed", "Invalid contact id"));
    }

    const contact = await this.contactRepository.getContactById(contactId);
    if (contact === null) {
      this.logger.warn("contact_call_not_found", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "call_contact",
        contactId: input.contactId,
        result: "not_found",
      });
      return err(createPlatformError("not_found", "Contact was not found"));
    }

    const result = await this.makeCallUseCase.execute({
      number: contact.primaryPhone,
      correlationId,
    });

    if (isErr(result)) {
      this.logger.warn("contact_call_failed", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "call_contact",
        contactId: contact.id,
        result: result.error.code,
      });
      return result;
    }

    this.logger.info("contact_call_started", {
      correlationId,
      featureId: "F-025",
      boundedContext: "Settings",
      operation: "call_contact",
      contactId: contact.id,
      result: "succeeded",
    });

    return ok(result.value);
  }
}

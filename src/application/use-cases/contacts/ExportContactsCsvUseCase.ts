import type { ContactRepository, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { serializeContactsCsv } from "../../import-export/ContactCsvCodec.js";

export type ExportContactsCsvInput = Readonly<{
  correlationId?: CorrelationId;
}>;

export type ExportContactsCsvResult = Readonly<{
  csvContents: string;
  contactCount: number;
}>;

/**
 * - Purpose: export current account contacts into canonical CSV text.
 * - Inputs: optional correlation id.
 * - Outputs: UTF-8 CSV payload for the active account contacts only.
 */
export class ExportContactsCsvUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ExportContactsCsvInput = {},
  ): Promise<Result<ExportContactsCsvResult, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    try {
      const contacts = await this.contactRepository.listContacts();
      const csvContents = serializeContactsCsv(contacts);

      this.logger.info("contacts_csv_export_prepared", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "export_contacts_csv",
        contactCount: contacts.length,
        result: "succeeded",
      });

      return ok({
        csvContents,
        contactCount: contacts.length,
      });
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error("contacts_csv_export_failed", {
        correlationId,
        featureId: "F-025",
        boundedContext: "Settings",
        operation: "export_contacts_csv",
        result: normalized.code,
      });
      return err(
        createPlatformError("operation_failed", "Failed to export contacts CSV", [normalized.code]),
      );
    }
  }
}

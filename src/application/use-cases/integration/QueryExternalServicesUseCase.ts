/**
 * - Purpose: load External Services UI-safe configuration and journal projections.
 * - Inputs: active profile key and optional journal limit.
 * - Outputs: collections, request rows, enabled counts, revision, and newest journal entries.
 */

import type {
  ExternalServiceCollection,
  ExternalServiceJournalEntry,
  ExternalServiceRequest,
  ExternalServicesSettings,
  SettingsAccountKey,
} from "@domain/index.js";
import type { SettingsRepository } from "@ports/index.js";
import type { ExternalServicesJournalRepository } from "@ports/integration/ExternalServicesJournalRepository.js";
import { createPlatformError, type PlatformError } from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";
import type { ExternalServicesRuntimeRegistry } from "../../services/integration/external-services/ExternalServicesRuntimeRegistry.js";

export type QueryExternalServicesInput = Readonly<{
  profileKey: SettingsAccountKey;
  journalLimit?: number;
}>;

export type ExternalServicesCollectionView = Readonly<{
  collection: ExternalServiceCollection;
  enabledRequestCount: number;
  requestCount: number;
  requests: ReadonlyArray<ExternalServiceRequest>;
}>;

/** Journal slice status — settings query stays ok when journal fails or is skipped. */
export type ExternalServicesJournalQueryStatus = "ready" | "skipped" | "error";

export type QueryExternalServicesOutcome = Readonly<{
  profileKey: SettingsAccountKey;
  settings: ExternalServicesSettings;
  settingsRevision: number;
  matchingEnabled: boolean;
  collections: ReadonlyArray<ExternalServicesCollectionView>;
  enabledCollectionCount: number;
  journal: ReadonlyArray<ExternalServiceJournalEntry>;
  journalStatus: ExternalServicesJournalQueryStatus;
}>;

export type QueryExternalServicesUseCaseDeps = Readonly<{
  settingsRepository: SettingsRepository;
  journalRepository: ExternalServicesJournalRepository;
  registry: ExternalServicesRuntimeRegistry;
}>;

export class QueryExternalServicesUseCase {
  constructor(private readonly deps: QueryExternalServicesUseCaseDeps) {}

  async execute(
    input: QueryExternalServicesInput,
  ): Promise<Result<QueryExternalServicesOutcome, PlatformError>> {
    const runtime = this.deps.registry.getSnapshot();
    const matchingEnabled =
      runtime.profileKey !== null && runtime.profileKey === input.profileKey;

    try {
      const settings = matchingEnabled
        ? runtime.settings
        : (await this.deps.settingsRepository.getUserSettings(input.profileKey))
            .externalServices;
      const journalLimit = normalizeJournalLimit(input.journalLimit);
      const journalSlice = await this.loadJournalSlice(input.profileKey, journalLimit);
      return ok({
        profileKey: input.profileKey,
        settings,
        settingsRevision: matchingEnabled ? runtime.settingsRevision : 0,
        matchingEnabled,
        collections: settings.collections.map((collection) => ({
          collection,
          enabledRequestCount: collection.requests.filter((request) => request.enabled)
            .length,
          requestCount: collection.requests.length,
          requests: collection.requests,
        })),
        enabledCollectionCount: settings.collections.filter(
          (collection) => collection.enabled,
        ).length,
        journal: journalSlice.journal,
        journalStatus: journalSlice.journalStatus,
      });
    } catch (error: unknown) {
      return err(
        createPlatformError(
          "operation_failed",
          "Failed to query External Services state.",
          {
            reason:
              error instanceof Error
                ? error.message
                : "external_services_query_failed",
          },
        ),
      );
    }
  }

  private async loadJournalSlice(
    profileKey: SettingsAccountKey,
    journalLimit: number,
  ): Promise<
    Readonly<{
      journal: ReadonlyArray<ExternalServiceJournalEntry>;
      journalStatus: ExternalServicesJournalQueryStatus;
    }>
  > {
    if (journalLimit === 0) {
      return { journal: [], journalStatus: "skipped" };
    }
    try {
      const journal = await this.deps.journalRepository.list(profileKey, journalLimit);
      return { journal, journalStatus: "ready" };
    } catch {
      return { journal: [], journalStatus: "error" };
    }
  }
}

function normalizeJournalLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return 100;
  }
  if (!Number.isSafeInteger(limit) || limit < 0) {
    return 0;
  }
  return Math.min(limit, 100);
}

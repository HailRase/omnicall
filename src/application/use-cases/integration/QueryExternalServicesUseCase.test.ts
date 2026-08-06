/**
 * - Purpose: verify QueryExternalServicesUseCase projections for active and inactive profiles.
 * - Inputs: settings/journal fixtures and runtime registry state.
 * - Outputs: matchingEnabled and journal visibility assertions.
 */

import { describe, expect, it, vi } from "vitest";
import type { ExternalServicesJournalRepository } from "@ports/integration/ExternalServicesJournalRepository.js";
import {
  createDefaultUserSettings,
  createSettingsAccountKey,
  type ExternalServiceCollectionId,
  type ExternalServiceJournalEntry,
  type ExternalServiceKeyValueId,
  type ExternalServiceRequestId,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { InMemoryExternalServicesJournalRepository } from "@adapters/mock/InMemoryExternalServicesJournalRepository.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { ExternalServicesRuntimeRegistry } from "../../services/integration/external-services/ExternalServicesRuntimeRegistry.js";
import {
  createExternalServicesTestSettings,
} from "../../services/integration/external-services/externalServicesTestFixtures.js";
import { QueryExternalServicesUseCase } from "./QueryExternalServicesUseCase.js";

const profileA = createSettingsAccountKey("agent-a@example.test");
const profileB = createSettingsAccountKey("agent-b@example.test");

function createEntry(
  profileKey: ReturnType<typeof createSettingsAccountKey>,
  id: string,
): ExternalServiceJournalEntry {
  return {
    id,
    profileKey,
    collectionId: "00000000-0000-4000-8000-000000000001" as ExternalServiceCollectionId,
    collectionName: "Main",
    requestId: "00000000-0000-4000-8000-000000000002" as ExternalServiceRequestId,
    requestName: "Notify",
    method: "POST",
    eventType: "manual_run",
    startedAt: "2026-07-29T00:00:00.000Z",
    durationMs: 5,
    outcome: "http_success",
    status: 200,
    requestUrl: "https://example.test",
    requestHeaders: [
      {
        id: "00000000-0000-4000-8000-000000000003" as ExternalServiceKeyValueId,
        key: "Authorization",
        value: "***",
        enabled: true,
      },
    ],
    requestBody: "{\"event\":\"manual_run\"}",
    requestBodyTruncated: false,
    responseBody: "ok",
    responseBodyTruncated: false,
    errorCode: null,
    errorMessage: null,
    correlationId: "corr_query_es" as CorrelationId,
  };
}

describe("QueryExternalServicesUseCase", () => {
  it("returns active matching state and isolates journal buckets", async () => {
    const settingsRepository = new InMemorySettingsRepository();
    const journal = new InMemoryExternalServicesJournalRepository();
    const settings = createExternalServicesTestSettings();
    await settingsRepository.saveUserSettings(profileA, {
      ...createDefaultUserSettings(),
      externalServices: settings,
    });
    await settingsRepository.saveUserSettings(profileB, createDefaultUserSettings());
    await journal.append(profileA, createEntry(profileA, "a1"));
    await journal.append(profileB, createEntry(profileB, "b1"));
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(profileA, settings, 4);
    const useCase = new QueryExternalServicesUseCase({
      settingsRepository,
      journalRepository: journal,
      registry,
    });

    const active = await useCase.execute({ profileKey: profileA, journalLimit: 10 });
    const other = await useCase.execute({ profileKey: profileB, journalLimit: 10 });

    expect(active.ok).toBe(true);
    expect(other.ok).toBe(true);
    if (!active.ok || !other.ok) {
      return;
    }
    expect(active.value.matchingEnabled).toBe(true);
    expect(active.value.settingsRevision).toBe(4);
    expect(active.value.journalStatus).toBe("ready");
    expect(active.value.journal.map((entry) => entry.id)).toEqual(["a1"]);
    expect(other.value.matchingEnabled).toBe(false);
    expect(other.value.journal.map((entry) => entry.id)).toEqual(["b1"]);
  });

  it("skips journal I/O when journalLimit is 0", async () => {
    const settingsRepository = new InMemorySettingsRepository();
    const journal = new InMemoryExternalServicesJournalRepository();
    const settings = createExternalServicesTestSettings();
    await settingsRepository.saveUserSettings(profileA, {
      ...createDefaultUserSettings(),
      externalServices: settings,
    });
    const listSpy = vi.spyOn(journal, "list");
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(profileA, settings, 1);
    const useCase = new QueryExternalServicesUseCase({
      settingsRepository,
      journalRepository: journal,
      registry,
    });

    const result = await useCase.execute({ profileKey: profileA, journalLimit: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.journalStatus).toBe("skipped");
    expect(result.value.journal).toEqual([]);
    expect(listSpy).not.toHaveBeenCalled();
  });

  it("keeps settings ok when journal repository fails", async () => {
    const settingsRepository = new InMemorySettingsRepository();
    const settings = createExternalServicesTestSettings();
    await settingsRepository.saveUserSettings(profileA, {
      ...createDefaultUserSettings(),
      externalServices: settings,
    });
    const journal: ExternalServicesJournalRepository = {
      list: () =>
        Promise.reject(
          new Error("external_services_journal_document_requires_recovery"),
        ),
      append: () => Promise.resolve(undefined),
    };
    const registry = new ExternalServicesRuntimeRegistry();
    registry.activateProfile(profileA, settings, 2);
    const useCase = new QueryExternalServicesUseCase({
      settingsRepository,
      journalRepository: journal,
      registry,
    });

    const result = await useCase.execute({ profileKey: profileA, journalLimit: 10 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.journalStatus).toBe("error");
    expect(result.value.journal).toEqual([]);
    expect(result.value.settings.collections).toHaveLength(1);
    expect(result.value.settingsRevision).toBe(2);
  });
});

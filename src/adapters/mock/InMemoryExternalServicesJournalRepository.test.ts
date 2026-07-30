import { describe, expect, it } from "vitest";
import { InMemoryExternalServicesJournalRepository } from "./InMemoryExternalServicesJournalRepository.js";
import { EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES } from "@ports/integration/ExternalServicesJournalRepository.js";
import type {
  ExternalServiceCollectionId,
  ExternalServiceJournalEntry,
  ExternalServiceKeyValueId,
  ExternalServiceRequestId,
  SettingsAccountKey,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

const profileA = "agent-a@example.test" as SettingsAccountKey;
const profileB = "agent-b@example.test" as SettingsAccountKey;

function createEntry(
  profileKey: SettingsAccountKey,
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
    durationMs: 10,
    outcome: "http_success",
    status: 200,
    requestUrl: "https://example.test/webhook",
    requestHeaders: [
      {
        id: "00000000-0000-4000-8000-000000000003" as ExternalServiceKeyValueId,
        key: "Authorization",
        value: "***",
        enabled: true,
      },
    ],
    responseBody: "ok",
    responseBodyTruncated: false,
    errorCode: null,
    errorMessage: null,
    correlationId: "corr_external_services_test" as CorrelationId,
  };
}

describe("InMemoryExternalServicesJournalRepository", () => {
  it("isolates profile buckets and returns newest records first", async () => {
    const repository = new InMemoryExternalServicesJournalRepository();
    await repository.append(profileA, createEntry(profileA, "first"));
    await repository.append(profileA, createEntry(profileA, "second"));
    await repository.append(profileB, createEntry(profileB, "other"));

    await expect(repository.list(profileA, 10)).resolves.toMatchObject([
      { id: "second" },
      { id: "first" },
    ]);
    await expect(repository.list(profileB, 10)).resolves.toMatchObject([
      { id: "other" },
    ]);
  });

  it("rejects unredacted protected headers and caps a profile at one hundred", async () => {
    const repository = new InMemoryExternalServicesJournalRepository();
    const unsafeEntry = {
      ...createEntry(profileA, "unsafe"),
      requestHeaders: [
        {
          id: "00000000-0000-4000-8000-000000000003" as ExternalServiceKeyValueId,
          key: "X-Api-Key",
          value: "secret",
          enabled: true,
        },
      ],
    };

    await expect(repository.append(profileA, unsafeEntry)).rejects.toThrow(
      "redact protected headers",
    );

    await Promise.all(
      Array.from({ length: EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES + 1 }, (_, index) =>
        repository.append(profileA, createEntry(profileA, `entry-${index}`)),
      ),
    );

    const entries = await repository.list(profileA, 200);
    expect(entries).toHaveLength(EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES);
    expect(entries[0]?.id).toBe("entry-100");
    expect(entries.at(-1)?.id).toBe("entry-1");
  });
});

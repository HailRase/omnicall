/**
 * - Purpose: verify file journal isolation, restart, and corrupt fail-visible behavior.
 * - Inputs: temporary storage roots and profile-scoped journal commands.
 * - Outputs: repository contract assertions for WU-05.
 */

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type {
  ExternalServiceCollectionId,
  ExternalServiceJournalEntry,
  ExternalServiceKeyValueId,
  ExternalServiceRequestId,
  SettingsAccountKey,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { FileExternalServicesJournalRepository } from "./FileExternalServicesJournalRepository.js";
import { resolveExternalServicesJournalFilePath } from "./profileStoragePaths.js";

const tempRoots: string[] = [];
const profileA = "agent-a@example.test" as SettingsAccountKey;
const profileB = "agent-b@example.test" as SettingsAccountKey;

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await rm(root, { recursive: true, force: true });
    }),
  );
});

async function createRepository(): Promise<{
  repository: FileExternalServicesJournalRepository;
  root: string;
  filesystem: NodeFileSystemAdapter;
}> {
  const root = await mkdtemp(join(tmpdir(), "omnicall-es-journal-"));
  tempRoots.push(root);
  const filesystem = new NodeFileSystemAdapter();
  return {
    repository: new FileExternalServicesJournalRepository({
      storageRoot: root,
      filesystem,
      logger: createTestLogger(),
    }),
    root,
    filesystem,
  };
}

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
    durationMs: 12,
    outcome: "http_success",
    status: 200,
    requestUrl: "https://example.test/hook",
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
    correlationId: "corr_es_journal_file" as CorrelationId,
  };
}

describe("FileExternalServicesJournalRepository", () => {
  it("treats missing files as empty and isolates profile buckets", async () => {
    const { repository } = await createRepository();
    await expect(repository.list(profileA, 10)).resolves.toEqual([]);
    await repository.append(profileA, createEntry(profileA, "a1"));
    await repository.append(profileB, createEntry(profileB, "b1"));
    await expect(repository.list(profileA, 10)).resolves.toMatchObject([
      { id: "a1" },
    ]);
    await expect(repository.list(profileB, 10)).resolves.toMatchObject([
      { id: "b1" },
    ]);
  });

  it("restores journal after restart from disk", async () => {
    const { repository: first, root, filesystem } = await createRepository();
    await first.append(profileA, createEntry(profileA, "persisted"));
    const second = new FileExternalServicesJournalRepository({
      storageRoot: root,
      filesystem,
      logger: createTestLogger(),
    });
    await expect(second.list(profileA, 10)).resolves.toMatchObject([
      { id: "persisted" },
    ]);
    expect(resolveExternalServicesJournalFilePath(root, profileA)).toContain(
      "external-services-journal",
    );
  });

  it("fails visibly when the current journal document is corrupt", async () => {
    const { repository } = await createRepository();
    await repository.seedCorruptJson(profileA, "{not-json");
    await expect(repository.list(profileA, 10)).rejects.toThrow(
      "external_services_journal_document_requires_recovery",
    );
    await expect(
      repository.append(profileA, createEntry(profileA, "next")),
    ).rejects.toThrow("external_services_journal_document_requires_recovery");
  });
});

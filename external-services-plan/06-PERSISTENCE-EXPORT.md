# F-031 Persistence and Export

- Purpose: preserve External Services per profile and support portable, validated JSON transfer.
- Inputs: active `SettingsAccountKey`, validated settings, journal entries, and unknown import files.
- Outputs: atomic profile storage, F-030 round trips, and versioned single-collection documents.

## Profile-local configuration

- Store `externalServices` inside `UserSettings` v12.
- Existing `SettingsRepository` remains the only config persistence port.
- `FileSettingsRepository` writes `{storageRoot}/profiles/settings/{base64url(profileKey)}.json` atomically.
- `InMemorySettingsRepository` supports deterministic tests.
- Fresh/anonymous profiles default to zero collections and no runtime dispatch.
- Save Use Cases load current settings, replace only `externalServices`, validate the complete aggregate, save under the active key, and refresh runtime registry.
- Failed validation/persistence leaves the prior runtime revision active.

Do not create a parallel External Services config JSON file or store. That would break aggregate migration, profile isolation, and F-030 portability.

## Journal persistence

Add a dedicated per-profile journal path through `profileStoragePaths.ts`, for example:

```txt
{storageRoot}/profiles/external-services-journal/{base64url(profileKey)}.json
```

- File document has its own `format: "omnicall.external-services-journal"` and `formatVersion: 1`.
- Adapter validates unknown JSON, treats missing file as empty, and fails visibly on corrupt current data (`external_services_journal_document_requires_recovery`).
- Append uses atomic write and caps records to latest 100.
- Only redacted/truncated records cross the repository boundary.
- Journal is local operational history and is excluded from F-030 preferences export and collection export.
- Logout retains journal; different profile keys never share records.
- **Query isolation:** `QueryExternalServicesUseCase` must not fail settings/collections when journal list throws; UI shows History error + Retry while COLLECTIONS remain usable. Settings-only refresh uses `journalLimit: 0` (no journal I/O). Recovery of a corrupt journal file remains operator/admin (replace/delete the profile journal JSON); silent wipe is not automatic.

## `UserSettings` migration

- Bump `SETTINGS_SCHEMA_VERSION` 11 → 12 in WU-01.
- Current v12 requires valid `externalServices`.
- v3–v11 coercion supplies `EXTERNAL_SERVICES_DEFAULTS` when absent and parses when present.
- v1/v2/v0 migrations inherit defaults.
- Unknown future schemas fail closed.
- Update all migration fixtures that assert current schema values.

## F-030 operator preferences

Keep `PREFERENCES_EXPORT_FORMAT_VERSION = 1` unless the outer document shape changes. F-031 changes nested `UserSettings`, whose version already migrates independently.

Update:

```txt
src/domain/settings/PreferencesExportDocument.ts
src/domain/settings/PreferencesExportDocument.test.ts
src/application/use-cases/settings/OperatorPreferencesUseCases.test.ts
docs/softphone/P11-Operator-Preferences-Export-Design.md
```

Rules:

- Export includes all External Services collections, requests, variables, query rows, headers, bodies, switches, and enable states.
- Import targets the active profile and replaces that profile’s External Services configuration through the existing whole-settings import.
- External Service header/query values are ordinary user configuration and remain portable by locked product decision.
- Existing exclusions remain unchanged: SIP passwords, OCP API keys, SDK pairing blobs, machine device IDs, update-banner state, and `ocpIntegration.linked`.
- Existing forbidden-field-name scanner continues to scan object property names; key/value rows use neutral fields `key` and `value`, so authored names such as `Authorization` are values, not secret-like JSON property names.
- Journal entries and Run results are never included.
- After successful import, facade refreshes the F-031 runtime registry and renderer projection in addition to current headset/settings refresh.
- Invalid import must not mutate settings or runtime state.

## Single-collection format

```ts
type ExternalServiceCollectionDocumentV1 = Readonly<{
  format: "omnicall.external-service-collection";
  formatVersion: 1;
  exportedAt: string;
  collection: ExternalServiceCollection;
}>;
```

- Suggested filename: `omnicall-external-service-{safe-name}.json`.
- Serialization uses UTF-8 pretty JSON plus trailing newline.
- Export preserves IDs for stable backup fidelity.
- Import validates from `unknown`, then always regenerates the collection ID, every request ID, and every key/value row ID to avoid collisions.
- Imported name is preserved when unique; otherwise append `(copy)`, `(copy 2)`, and the first available deterministic suffix.
- Unknown format/version, unsupported trigger/method/body mode, invalid UUID, duplicate IDs, malformed rows, and oversized file fail closed.
- Import never accepts Postman v2.1 or scripts.

Candidate Domain/Application files:

```txt
src/domain/integration/external-services/ExternalServiceCollectionDocument.ts
src/application/use-cases/integration/ExportExternalServiceCollectionUseCase.ts
src/application/use-cases/integration/ImportExternalServiceCollectionUseCase.ts
src/ports/integration/ExternalServicesCollectionFileGateway.ts
src/adapters/mock/MockExternalServicesCollectionFileGateway.ts
src/adapters/platform/PreloadExternalServicesCollectionFileGateway.ts
```

## File IPC

- Add narrow shared contracts for save dialog and open/read dialog.
- Main allows JSON extension and bounds file size; recommended maximum is 2 MiB because product count is unbounded but UI files need a safety cap.
- Validate request and response payloads in main/preload adapters.
- Do not expose arbitrary filesystem paths, raw `ipcRenderer`, or Node APIs to renderer.
- Cancelled dialogs return a typed cancelled outcome, not an exception.
- Read/write failures map to structured Platform errors and translated UI messages.

## Profile lifecycle

| Lifecycle | Config | Pending jobs | In-flight jobs | Journal |
| --- | --- | --- | --- | --- |
| App start with active profile | Load/migrate before enabling matcher | none | none | lazy query or repository load |
| Successful profile activation | Replace runtime snapshot | cancel old profile | old jobs finish to old bucket | isolate by new key |
| Logout | Keep disk config, disable matcher | cancel | finish | retain |
| Failed sign-in draft | Do not promote/load candidate config | unchanged | unchanged | unchanged |
| F-030 import | Replace active settings after validation | invalidate stale revision | finish immutable snapshot | retain |
| Delete/disable definition | Save new revision | drop invalid pending IDs | finish | retain snapshots |

## Tests

- Profile A/B settings and journal isolation across logout/sign-in.
- v11→v12 migration and missing defaults.
- F-030 export/import round trip with External Services definitions.
- Existing secret exclusions remain absent.
- Post-import runtime refresh takes effect without restart.
- Collection round trip, collision regeneration, deterministic copy suffix, unknown version, malformed and oversized import.
- Atomic journal append/cap/corrupt-file behavior.

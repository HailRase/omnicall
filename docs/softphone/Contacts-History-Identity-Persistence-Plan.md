# Contacts, History, Identity, And Persistence Plan

## Purpose

Build a production-ready contacts and call-history experience that persists per local SIP account, enriches history and active calls with contact names, supports iPhone-like history details, lets operators delete history entries, creates contacts from unknown history numbers, and imports/exports contacts through CSV files.

This plan is written for agents with no prior conversation context. Follow it step by step; do not implement it as one large change.

## Goals

- Persist contacts and call history on Windows, macOS, and Linux under the existing Axatalk profile storage.
- Scope contacts and call history to the same `SettingsAccountKey` used by per-account settings.
- Resolve one caller identity consistently in history, incoming calls, outgoing calls, and active call lines.
- Add iPhone-like history details with calm grouped actions, clear metadata, and safe destructive actions.
- Add unknown history numbers to contacts through a prefilled create-contact flow.
- Import and export contacts through a documented CSV format with validation and user-visible summaries.
- Keep UI components presentational and business logic in Domain/Application/Ports/Adapters.
- Make every phase independently reviewable, testable, and resumable by a fresh agent.

## Non-Goals

- Do not add cloud sync or server-side contacts.
- Do not persist SIP passwords or secrets in JSON.
- Do not use browser `localStorage`, IndexedDB, or renderer filesystem access.
- Do not move contact matching into React components.
- Do not mutate historical records just because a contact name changes.
- Do not replace the existing shell navigation model without explicit approval.
- Do not introduce Tailwind, shadcn CLI output, or new router dependencies.
- Do not expose arbitrary filesystem access through the existing profiles filesystem IPC.
- Do not silently overwrite contacts during CSV import without an explicit import policy.

## Mandatory Read Order

Every implementation agent must read these files before coding:

1. `docs/softphone/STATUS.md`
2. `docs/softphone/Architecture-Constitution.md`
3. `docs/softphone/UI-Architecture.md`
4. `docs/softphone/UX-UI-Design-Blueprint.md`
5. `docs/ui-kit/UI-KIT.md`
6. `docs/ui-kit/VISUAL-SPEC.md`
7. `docs/softphone/Feature-Registry.md`
8. `docs/softphone/P11-Local-Account-Profiles-Design.md`
9. `docs/softphone/handoffs/Shell-Navigation-Contacts-History-Master-Agent-Prompt.md`
10. This file.

## Current Baseline

### Call History

- Feature: `F-013`, legacy IDs `LF-052`, `LF-053`, `LF-054`.
- Domain: `src/domain/settings/CallHistoryEntry.ts`, `CallHistoryEntryId.ts`, `CallHistoryRetention.ts`.
- Port: `src/ports/settings/CallHistoryRepository.ts`.
- Adapter: `src/adapters/settings/InMemoryCallHistoryRepository.ts`.
- Use Cases: `RecordCallHistoryUseCase`, `ListCallHistoryUseCase`, `RedialFromHistoryUseCase`.
- Projection/UI: `callHistoryProjection`, `deriveCallHistoryShell`, `useCallHistoryShell`, `HistoryPanelShell`.
- Current gaps: no file persistence, no detail route, no delete, no contact enrichment.

### Contacts

- Feature: `F-025`.
- Domain: `src/domain/settings/Contact.ts`, `ContactId.ts`.
- Port: `src/ports/settings/ContactRepository.ts`.
- Adapter: `src/adapters/settings/InMemoryContactRepository.ts`.
- Use Cases: create, update, delete, get, list, call contact.
- Projection/UI: `contactsProjection`, `deriveContactsShell`, `useContactsShell`, `useContactEditShell`, `ContactsPanelShell`.
- Current gaps: no file persistence, no phone uniqueness rule, no history/active-call matching.

### Profile Persistence

- Existing profile root: `{userData}/axatalk/profiles/`.
- Real path resolver: `resolveAxatalkProfilesStorageRoot()`.
- Renderer bridge: `resolveRealBootstrapDiskOptions()` + `PreloadFileSystemAdapter`.
- Main IPC sandbox: `registerProfilesPersistenceIpc()`.
- File boundary: `FileSystemPort`.
- Account key: `SettingsAccountKey`, derived from SIP username/domain/server without password.
- Filename encoding: `encodeProfileKeyForFileName()`.

## Architectural Laws

- UI calls Actions hooks only; Actions hooks call `AccountBootstrapFacade`.
- React components must not import Domain, Ports, Adapters, repositories, Electron, SIP, or filesystem modules.
- Domain owns validation and pure identity rules.
- Application owns orchestration, Use Cases, projections, and read-model joins.
- Ports define storage contracts; Adapters implement filesystem persistence.
- Infrastructure owns Electron paths, IPC, and OS-specific filesystem access.
- History persistence is append/read/delete through `CallHistoryRepository`.
- Contact persistence is CRUD through `ContactRepository`.
- Caller name matching is a read-model enrichment, not a stored history mutation.

## Target Data Layout

Use the existing profiles root and add two per-profile directories:

```txt
{userData}/axatalk/profiles/
  index.json
  settings/
    {encodedProfileKey}.json
  contacts/
    {encodedProfileKey}.json
  call-history/
    {encodedProfileKey}.json
```

Platform examples are determined by Electron `app.getPath("userData")`:

- Windows: `%APPDATA%/Axatalk/axatalk/profiles/...`
- macOS: `~/Library/Application Support/Axatalk/axatalk/profiles/...`
- Linux: `~/.config/Axatalk/axatalk/profiles/...`

## Persisted Document Schemas

### Contacts Document V1

```json
{
  "schemaVersion": 1,
  "contacts": []
}
```

Rules:

- Validate every object through a parser boundary before it reaches repositories.
- Preserve `ContactId`, `displayName`, `primaryPhone`, `secondaryPhone`, `company`, `notes`, `createdAt`, `updatedAt`.
- Reject invalid records conservatively; log corrupt documents.
- Do not include credentials or account metadata.

### Call History Document V1

```json
{
  "schemaVersion": 1,
  "entries": []
}
```

Rules:

- Preserve `CallHistoryEntry` fields exactly.
- Enforce `MAX_CALL_HISTORY_ENTRIES` on load and append.
- Keep newest first.
- Do not overwrite `displayLabel` with contact names.
- Do not include credentials or account metadata.

## Identity Resolution Policy

Create one Application read model:

```txt
src/application/read-models/contactDirectory.ts
```

Responsibilities:

- Build a normalized phone index from contacts.
- Match `primaryPhone` and `secondaryPhone`.
- Return caller presentation for history and active calls.
- Expose contact id when a match exists.
- Keep deterministic behavior when contacts change.

Recommended API shape:

```ts
export type CallerPresentationSource = "contact" | "sip" | "number" | "unknown";

export type CallerPresentation = Readonly<{
  primaryLabel: string;
  secondaryLabel: string | null;
  contactId: string | null;
  source: CallerPresentationSource;
}>;
```

Display priority:

1. Contact `displayName` when the normalized phone matches.
2. SIP/display label when no contact matches and label differs from the number.
3. Normalized phone number.
4. Localized unknown label only when no usable number exists.

Conflict rule:

- Preferred: enforce unique normalized phone numbers across contacts at create/update time.
- Interim fallback: `primaryPhone` beats `secondaryPhone`; then stable contact sort order.
- Do not ship ambiguous matching without a test that documents the chosen fallback.

## UX Target

### Visual Direction

The history detail and add-contact flows should feel iPhone-like, adapted to the current desktop shell:

- Large centered avatar/initials at the top.
- Primary caller name or number as the hero label.
- Secondary phone and metadata below in muted text.
- Rounded grouped action cells, not dense enterprise tables.
- Clear action row: call, message placeholder only if implemented later, add/open contact.
- Grouped metadata sections: call type, date, time, duration, outcome.
- Destructive delete separated at the bottom in a danger tone.
- Smooth sidebar/panel transitions using existing shell panel animation language.
- Calm neutral surfaces with project tokens, not iOS color literals.

### UI Kit Primitives To Reuse

- `Button` for primary and destructive actions.
- `IconButton` for compact header/back/action controls where already suitable.
- `AlertDialog` for delete confirmation.
- `Dialog` only when a blocking flow is required.
- `DropdownMenu` for row overflow actions if list rows get secondary actions.
- `FormField`, `Input`, `Textarea` for contact create/edit.
- `Tabs` for existing history filters.
- `Badge` for outcome/source labels when useful.
- `Skeleton` or current loading state for detail loading.
- `Toast`/notification system for success and failure feedback.
- `PersonListAvatar` and `ListQuickCallButton` for list continuity.

### Color And Style Rules

- Use `--color-bg-surface`, `--color-bg-surface-elevated`, `--color-bg-surface-alt`, and `--color-bg-surface-deep`.
- Use `--color-text-primary`, `--color-text-secondary`, and `--color-text-muted`.
- Use `--color-accent-primary` for positive call/contact actions.
- Use `--color-text-danger`, `--color-bg-danger`, and destructive `Button` for deletion.
- Use `--color-border-subtle` and `--shadow-menu-elevated` for grouped cards and elevated surfaces.
- Use `--radius-control` for action pills and `--radius-panel` for grouped panels.
- Do not hardcode hex/rgb values in new component CSS.
- Do not use CSS `filter` or `brightness` for hover/active states.

## UX State Inventory

### History List

- Idle empty.
- Loading.
- Load error.
- Populated all calls.
- Populated missed-only filter.
- Row with contact match.
- Row without contact match.
- Row redial disabled by registration.
- Row redial disabled by active-call policy.

### History Detail

- Loading.
- Not found.
- Found with contact match.
- Found without contact match.
- Missed incoming.
- Failed outgoing.
- Completed incoming/outgoing.
- Redial disabled.
- Delete pending.
- Delete failed.
- Deleted and navigated back.

### Add To Contacts

- Unknown number opens prefilled create form.
- Known number opens existing contact details.
- Prefill display name from SIP label only when it is not the phone number.
- Validation errors show field-level messages.
- Duplicate phone returns deterministic validation feedback.
- Save success navigates to contact details.
- Incoming active call remains visible above or alongside the sidebar.

### CSV Import/Export

- Export action available from contacts list toolbar or overflow menu.
- Import action available from contacts list toolbar or overflow menu.
- Import file picker cancelled.
- Import invalid CSV structure.
- Import valid rows with all new contacts.
- Import rows with duplicate phones.
- Import rows with partial validation failures.
- Import summary shows created, updated/skipped, failed counts.
- Export success notification.
- Export write cancelled or failed.

## Route Model

Extend typed shell routes, not business logic:

```ts
type ShellRoute =
  | { name: "history" }
  | { name: "historyDetails"; entryId: string }
  | { name: "contacts" }
  | { name: "contactDetails"; contactId: string }
  | { name: "contactEdit"; contactId: string };
```

Recommended paths:

```txt
/history
/history/:entryId
/contacts
/contacts/:contactId
/contacts/:contactId/edit
/contacts/new/edit
```

Prefill rule:

- Do not store full business data in route params.
- Use route-data state or a typed navigation intent to prefill contact creation.
- If app reload loses prefill state, the form must still be safe and empty.

## CSV Import/Export Contract

CSV is an external interchange format. Treat it as untrusted input and validate it before it reaches `ContactRepository`.

Recommended header:

```csv
displayName,primaryPhone,secondaryPhone,company,notes
```

Rules:

- UTF-8 text only.
- First row is a header row.
- Comma delimiter.
- RFC-4180-style quoted fields: quoted values may contain commas, quotes, and newlines.
- Export always writes the canonical header above.
- Import accepts canonical headers case-insensitively and trims surrounding header whitespace.
- Empty optional fields map to `null` through existing contact creation/update rules.
- `primaryPhone` and `displayName` are required.
- Every row is validated through existing `createContact` / `updateContact` rules.
- Phone duplicate policy from Phase 3/7 applies to imported rows and existing contacts.
- Import must produce a summary; never fail the entire file only because one row is invalid.
- Parser errors that make row boundaries unsafe may reject the file before mutations.

Import policy:

- Default policy: create only, skip existing normalized phone matches.
- Optional future policy: update existing matches after an explicit confirmation UI.
- Do not auto-merge notes or secondary phones without a documented policy.

File access:

- Do not use `profiles:invoke-filesystem` for arbitrary user-selected files.
- Add a dedicated typed IPC contract for contacts CSV import/export.
- Main process owns Electron `dialog.showOpenDialog` and `dialog.showSaveDialog`.
- Preload exposes narrow methods, not filesystem paths or raw `ipcRenderer`.
- Renderer receives CSV text or a typed result only; it never receives arbitrary filesystem powers.

Recommended IPC surface:

```txt
contactsCsv:openImportDialog -> { ok, cancelled, contents? }
contactsCsv:saveExportDialog -> { ok, cancelled, reason? }
```

Use exact names only after adding typed contracts in `src/shared/ipc/`.

## Implementation Phases

### Phase 0: Discovery, Registry, And Contract Lock

Status: planned.

Purpose:

- Lock affected features and avoid untracked architecture changes.

Deliverables:

- Update `F-013` acceptance to include file persistence, detail view, delete.
- Update `F-025` acceptance to include file persistence, add-from-history, duplicate phone behavior.
- Add a new registry entry if reviewers prefer a separate identity feature, e.g. `F-026: Caller Identity Presentation`.
- List all affected files before code.
- Confirm no version bump unless this becomes a shipped user-visible release cut.

Gate:

- Reviewer can map every planned user action to a Use Case or facade method.
- No implementation starts before storage, identity, and UI contracts are written.

### Phase 1: Account-Scoped File Persistence

Status: **done** (2026-07-08).

Purpose:

- Persist contacts and call history per `SettingsAccountKey` on disk.

Deliverables:

- `parsePersistedContactsDocument`.
- `serializeContactsDocument`.
- `parsePersistedCallHistoryDocument`.
- `serializeCallHistoryDocument`.
- `FileContactRepository`.
- `FileCallHistoryRepository`.
- Path helpers in `profileStoragePaths.ts`.
- Bootstrap factories for real mode.
- Real wiring in `createRealAccountBootstrap`.

Required behavior:

- `resolveAccountKey()` is called on repository operations.
- Files are stored under `contacts/{encodedKey}.json` and `call-history/{encodedKey}.json`.
- Missing file returns empty list.
- Corrupt JSON logs warning and returns safe empty state.
- Writes are atomic through `FileSystemPort`.
- In-memory repositories remain default for mock/test/storybook.

Tests:

- File repository A -> B -> A isolation.
- Reload through new repository instance.
- Corrupt document recovery.
- Retention limit for history.
- Secret scanner prevents credential-like JSON where applicable.
- Real bootstrap injects file repositories when disk options exist.

Gate:

- A contact created under profile A is not visible under profile B.
- A history entry recorded under profile A is not visible under profile B.
- No renderer component imports filesystem or adapters.

### Phase 2: Profile Switch Reload Lifecycle

Status: **done** (2026-07-08).

Purpose:

- Prevent stale contacts/history projections after account authorization or profile switch.

Deliverables:

- Application-level reload method after successful account authorization.
- Store projection refresh for contacts and history.
- Integration tests for A -> B -> A.
- Clear behavior for logout and anonymous profile.

Recommended implementation:

- After `AuthorizeSipAccountUseCase` and registration succeed, `AccountBootstrapFacade` triggers active profile side effects.
- Add contacts/history reload into the same lifecycle or a small `ProfileScopedDataReloadService`.
- Call `listContacts()` and `listCallHistory()`.
- Apply `setContactsLoaded()` and `setCallHistoryLoaded()` through existing renderer Actions hooks or a facade event/reload bridge.

Gate:

- Switching accounts never shows previous account contacts/history.
- Failed authorization does not switch visible contacts/history.
- Logout does not delete persisted files.

### Phase 3: Contact Directory And Phone Identity

Status: **done** (2026-07-08).

Purpose:

- Resolve display names consistently without coupling UI to repositories.

Deliverables:

- `contactDirectory.ts` read model.
- Unit tests for normalization, primary/secondary matches, no match, duplicate fallback.
- Duplicate phone validation decision in Domain/Application.
- `deriveCallHistoryShell` input extended with contacts or caller presentation index.

Required behavior:

- Contact name beats SIP display name.
- SIP display name beats number only when no contact matches.
- Number remains available as secondary label.
- History records are not rewritten when contacts change.

Gate:

- Updating a contact name updates history and active call labels through projections/read models.
- Existing call history storage remains unchanged.

### Phase 4: Active Call Identity Enrichment

Status: **done** (2026-07-08).

Purpose:

- Show the same contact name in incoming calls, outgoing calls, active lines, and history.

Deliverables:

- Enrichment in `deriveCallLinesShell`.
- Enrichment in `deriveIncomingCallControlLine` or its input wrapper.
- Shell hooks pass contacts projection/read model into derive functions.
- Tests for incoming/outgoing active call labels.

Required behavior:

- Incoming overlay, controls, and call lines do not disagree on caller name.
- Outgoing calls to a contact number display contact name.
- Unknown numbers still display the number.
- Call controls remain usable when contacts are loading or failed.

Gate:

- No SIP adapter imports contacts.
- No Domain telephony object imports contacts.
- Active call UI remains mounted across history/contact routes.

### Phase 5: iPhone-Like History Detail UI

Status: **done** (2026-07-08).

Purpose:

- Let operators inspect a call history item in a clear detail view.

Deliverables:

- `GetCallHistoryEntryUseCase`.
- Route-data target for `historyDetails`.
- `useCallHistoryDetailShell`.
- `HistoryDetailPanel`.
- Story/test coverage for major states.
- i18n keys for all supported locales: `ru`, `en`, `fr`, `de`, `bg`.

UI anatomy:

```txt
Header:
  Back button, localized title

Hero:
  Large avatar
  Primary caller label
  Secondary number/contact source

Action group:
  Call / Redial
  Add to Contacts or Open Contact

Info group:
  Direction
  Outcome
  Date
  Time
  Duration

Danger group:
  Delete history entry
```

Gate:

- Detail route works from history list and direct route parsing.
- Not found state stays inside the sidebar/panel and does not crash.
- Redial disabled reason is visible and localized.

### Phase 6: Delete History Entry

Status: **done** (2026-07-08).

Purpose:

- Remove one call history item safely and persist the change.

Deliverables:

- Extend `CallHistoryRepository` with `deleteEntry`.
- `DeleteCallHistoryEntryUseCase`.
- `CallHistoryDeleted` domain event.
- Reducer support in `callHistoryProjection`.
- Facade method.
- Action hook.
- AlertDialog confirmation.
- Success/failure notifications.

Required behavior:

- Delete requires explicit confirmation.
- Delete updates disk and projection.
- Delete from detail navigates back to history list.
- Delete from list, if added later, removes only that row.
- Not-found delete returns a normalized error.

Gate:

- Deleting under profile A does not affect profile B.
- History detail cannot show a deleted entry after success.

### Phase 7: Add Unknown Number To Contacts

Status: **done** (2026-07-08).

Purpose:

- Convert unknown history numbers into contacts without duplicate records.

Deliverables:

- Find contact by phone use case or contact directory action.
- Prefill state for `contactEdit` create route.
- Extend `useContactEditShell` to accept safe initial values.
- Add history detail action: `Add to Contacts` or `Open Contact`.
- Duplicate phone validation and localized messages.

Required behavior:

- Known number opens contact details.
- Unknown number opens create form with `primaryPhone` prefilled.
- SIP display label may prefill `displayName` when it is useful.
- Save navigates to new contact details.
- Contact creation immediately enriches history and active calls.

Gate:

- No duplicate contact is created for an existing normalized phone number.
- Prefill never bypasses Domain validation.

### Phase 8: Contacts CSV Import/Export

Status: planned.

Purpose:

- Let operators move contacts between local account profiles and external tools through CSV without weakening storage boundaries.

Why this phase is after Phase 7:

- It depends on account-scoped contacts persistence.
- It depends on duplicate normalized phone policy.
- It benefits from the contact directory and add-to-contacts validation behavior already being stable.

Deliverables:

- `ContactCsvCodec` or equivalent pure parser/serializer module.
- `ImportContactsCsvUseCase`.
- `ExportContactsCsvUseCase`.
- Narrow `ContactCsvFileGateway` port or equivalent Application-facing file gateway.
- Typed IPC contracts for open/save CSV dialogs.
- Main process handlers using Electron `dialog`.
- Preload API methods with payload/response validation.
- Renderer actions hook methods for import/export.
- Contacts toolbar/menu actions using UI Kit controls.
- Import summary UI and notifications.
- i18n keys for all supported locales: `ru`, `en`, `fr`, `de`, `bg`.

Recommended layering:

```txt
UI
  -> useContactActions.importContactsCsv / exportContactsCsv
  -> AccountBootstrapFacade
  -> ImportContactsCsvUseCase / ExportContactsCsvUseCase
  -> ContactRepository + ContactCsvFileGateway
  -> Electron main dialog adapter through typed preload IPC
```

Required behavior:

- Export writes current account contacts only.
- Import mutates current account contacts only.
- Cancelled open/save dialogs do not show error notifications.
- Invalid CSV shows a localized error with no partial mutation when row boundaries are unsafe.
- Row-level validation failures are reported in a summary.
- Duplicate existing phones are skipped by default and counted.
- Import publishes `ContactCreated` events for created contacts so projections update normally.
- Export never writes passwords, settings, history, or account metadata.

UX requirements:

- Contacts list gets an overflow or compact toolbar action for import/export.
- Import requires a confirmation/summary when failures or duplicates exist.
- Export success should be a non-blocking notification.
- Import summary should be calm and scannable: created, skipped duplicates, failed rows.
- Do not block incoming calls with a long-lived modal.

Tests:

- CSV serializer escapes commas, quotes, and newlines.
- CSV parser handles quoted fields and invalid quotes.
- Import creates valid contacts.
- Import skips duplicate normalized phones by policy.
- Import reports row validation failures.
- Export includes canonical header and current account contacts.
- IPC contracts reject invalid payloads/responses.
- Main dialog adapter handles cancel and filesystem failure.
- Renderer action shows success/failure notifications without direct filesystem access.

Gate:

- Import/export works without leaking filesystem access to React components.
- Account A export contains only account A contacts.
- Import under account B does not affect account A.
- CSV roundtrip preserves supported contact fields.

### Phase 9: UX Polish, Accessibility, And i18n

Status: planned.

Purpose:

- Make the experience feel finished, accessible, and localized.

Deliverables:

- Light/dark visual review.
- Keyboard navigation review.
- Focus restore for dialogs and route transitions.
- `aria-label` coverage for icon-only actions.
- i18n key parity for `ru`, `en`, `fr`, `de`, `bg`.
- Storybook stories for detail panel, add-contact, and CSV summary states if project patterns allow.
- Update `docs/softphone/I18N-Coverage.md` if required by the current migration tracker.

Gate:

- `npm run i18n:check` passes.
- Focus visible is preserved.
- Destructive action is not adjacent to primary call action without visual separation.

### Phase 10: Final Gate And Release Readiness

Status: planned.

Purpose:

- Confirm the full vertical slice is production-ready.

Required checks:

- Focused unit tests for new Domain/Application/Adapters.
- Renderer tests for history details and add-contact behavior.
- Renderer tests for contacts CSV import/export behavior.
- Integration tests for account-scoped persistence.
- `npm run test`.
- `npm run lint`.
- `npm run typecheck`.
- `npm run i18n:check`.
- `npm run registry:check` if available.

Release note:

- This is a user-visible feature. When shipping, bump `package.json` minor version according to pre-1.0 SemVer rules and update `CHANGELOG.md` plus manifest sync.
- Do not bump version for intermediate planning or partial branches.

## Universal Quality Gates

Each phase must satisfy these gates:

- No `any`, no `@ts-ignore`, no `as unknown as`.
- No deprecated APIs.
- No hardcoded renderer copy outside i18n catalogs.
- No UI import from Domain, Ports, Adapters, Infrastructure, or filesystem.
- No repository access from React.
- No direct Electron access from renderer UI.
- No production TODOs or placeholders.
- No secrets in persisted JSON.
- No unrelated refactors.
- Existing call, registration, settings, notification, and update flows continue to work.

## Anti-Patterns To Reject

- Matching contacts inside `HistoryPanelShell.tsx`.
- Writing contacts/history through `localStorage`.
- Adding account id fields into every contact/history record when file path already scopes the account.
- Updating all history rows when a contact name changes.
- Adding a global `currentContactName` store slice for active calls.
- Making `CallHistoryEntry.displayLabel` mean both SIP label and contact label.
- Deleting history only from Zustand without repository and event flow.
- Passing full contact data through route params.
- Introducing a modal that hides incoming call controls.
- Reusing profiles filesystem IPC for arbitrary CSV import/export paths.
- Importing CSV directly from a React component.
- Treating CSV row strings as trusted contacts without Domain validation.
- Silently overwriting existing contacts during import.

## Agent Strengthening Rules

Use these rules to keep weaker agents on track:

- Start every implementation turn by listing the exact layer being changed.
- Keep one vertical slice per phase; do not mix persistence, matching, and UI in one PR.
- Write tests before wiring UI when the change is in Domain/Application/Adapters.
- For UI, define the state table before writing JSX.
- When unsure where logic belongs, prefer Application read model over React.
- When unsure whether data should be persisted, ask if it is account-scoped, session-scoped, or derived.
- Before final response, check touched files for boundary violations.
- If a phase reveals a required contract change, stop and document it before coding the next phase.

## Agent Prompt Templates

### Phase 1 Persistence Agent

```txt
You are implementing Phase 1 of docs/softphone/Contacts-History-Identity-Persistence-Plan.md.

Read the mandatory read order in that plan first. Implement only account-scoped file persistence for contacts and call history. Do not implement history details, delete UI, or contact matching.

Required outputs:
- persisted contacts/history document parsers and serializers
- FileContactRepository and FileCallHistoryRepository
- profileStoragePaths helpers
- real bootstrap wiring
- focused tests for A -> B -> A isolation, reload, corrupt JSON, retention

Constraints:
- use SettingsAccountKey and encodeProfileKeyForFileName
- use FileSystemPort only
- no renderer filesystem access
- no secrets in JSON
- no any, no deprecated APIs

Stop if a repository port contract must change beyond the phase scope.
```

### Phase 3 Identity Agent

```txt
You are implementing Phase 3 of docs/softphone/Contacts-History-Identity-Persistence-Plan.md.

Implement the Application read model for contact phone matching and caller presentation. Do not implement UI details or file persistence in this phase.

Required outputs:
- contactDirectory read model
- tests for primary phone, secondary phone, SIP label fallback, number fallback, duplicate fallback
- deriveCallHistoryShell integration or a minimal wrapper agreed by existing patterns

Constraints:
- do not mutate CallHistoryEntry records
- do not import repositories or Domain into renderer components
- contact display name has priority over SIP display label
- number remains available as secondary label
```

### Phase 5 UI Agent

```txt
You are implementing Phase 5 of docs/softphone/Contacts-History-Identity-Persistence-Plan.md.

Implement iPhone-like history details using the current shell, UI Kit, tokens, and i18n. Do not implement persistence or contact matching unless previous phases are complete.

Required outputs:
- historyDetails route and route-data loading
- GetCallHistoryEntryUseCase
- useCallHistoryDetailShell
- HistoryDetailPanel
- renderer tests and localized strings for ru/en/fr/de/bg

UX requirements:
- large avatar hero
- grouped rounded actions
- grouped call metadata
- separated destructive delete area if delete action exists
- incoming/active call UI remains mounted

Constraints:
- components are presentational
- actions go through hooks/facade
- no hardcoded text or colors
```

### Phase 7 Add-To-Contacts Agent

```txt
You are implementing Phase 7 of docs/softphone/Contacts-History-Identity-Persistence-Plan.md.

Implement add-to-contacts from history. Do not create duplicate contacts for existing normalized phone numbers.

Required outputs:
- known-number lookup path that opens contact details
- unknown-number path that opens new contact form with safe prefill
- duplicate phone validation and localized messages
- tests for known, unknown, duplicate, and save success

Constraints:
- prefill never bypasses Domain validation
- no business data stored in route params
- contact creation immediately updates projections through existing events
```

### Phase 8 Contacts CSV Agent

```txt
You are implementing Phase 8 of docs/softphone/Contacts-History-Identity-Persistence-Plan.md.

Implement contacts CSV import/export only after account-scoped contacts persistence and duplicate phone policy are complete. Do not implement history details or identity matching in this phase unless they are already done.

Required outputs:
- pure CSV parser/serializer for contacts
- ImportContactsCsvUseCase and ExportContactsCsvUseCase
- narrow file gateway or typed IPC contract for contacts CSV dialogs
- main/preload validation for open/save CSV flows
- renderer actions and contacts toolbar/menu controls
- import summary UX, notifications, and i18n keys for ru/en/fr/de/bg
- tests for quoting, invalid CSV, duplicates, validation failures, cancel, and account isolation

Constraints:
- do not use profiles filesystem IPC for arbitrary user-selected files
- do not expose raw file paths or ipcRenderer to React
- import validates every row through existing contact rules
- default import policy creates new contacts and skips existing normalized phone matches
- export includes only current account contacts
```

## Suggested File Map

```txt
src/domain/settings/
  persistedContacts.ts
  persistedCallHistory.ts

src/adapters/settings/
  FileContactRepository.ts
  FileCallHistoryRepository.ts
  profileStoragePaths.ts

src/application/read-models/
  contactDirectory.ts

src/application/use-cases/contacts/
  GetCallHistoryEntryUseCase.ts
  DeleteCallHistoryEntryUseCase.ts
  ImportContactsCsvUseCase.ts
  ExportContactsCsvUseCase.ts

src/application/import-export/
  ContactCsvCodec.ts

src/ports/settings/
  ContactCsvFileGateway.ts

src/renderer/hooks/
  useCallHistoryDetailShell.ts

src/renderer/components/history/
  HistoryDetailPanel.tsx
  HistoryDeleteConfirmationModal.tsx

src/renderer/components/contacts/
  ContactsImportSummaryPanel.tsx

src/shared/ipc/
  ContactsCsvFileContract.ts
```

## Definition Of Done

- Contacts and history persist per account across app restarts.
- Account A and account B never see each other's contacts or history.
- History, incoming calls, outgoing calls, and active call lines use the same caller presentation policy.
- Unknown history numbers can be added to contacts with a prefilled form.
- Known history numbers open the existing contact.
- Contacts can be imported from and exported to CSV with validation and account isolation.
- History entries can be inspected and deleted safely.
- UI follows the current UI Kit, semantic tokens, CSS Modules, i18n, and accessibility rules.
- Tests, docs, registry, and work-history are updated for the completed phase.

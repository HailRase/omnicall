# F-031 UI and UX

- Purpose: define a usable Settings workflow for collections, requests, manual execution, and journal review.
- Inputs: Application view models, translated copy, disabled reasons, and intent callbacks.
- Outputs: accessible UI intent only; no HTTP, repository, IPC, event matching, or business rules.

## Navigation

- Add `integrations-external-services` to `SettingsSectionId` in `src/renderer/components/settings/settingsSections.ts`.
- Add it as the second child of `integrations-group`, after OCP.
- Keep `integrations-sdk` as its existing top-level leaf per ADR-0018.
- Use translation key `settings.nav.integrations.externalServices`.
- Use semantic icon ID `settings.integrations.external-services`; update icon registry/catalog through the icons skill during WU-08.
- Test ID: `settings-nav-integrations-external-services`.
- Follow the existing Integrations/OCP pre-auth gate: disabled until an account profile is authenticated, with `settings.nav.disabled.authorizeFirst`.

Extend `SettingsIntegrationsPanelProps.sectionId` and render an External Services shell for the new leaf. The panel remains presentational and receives props from a dedicated shell hook/facade query.

## Workspace layout (Postman-like skeleton)

Use one full-bleed product workspace (not a wizard of stacked screens):

```txt
┌─ Sidebar (COLLECTIONS) ─┬─ Main workspace ─────────────────────────┐
│ Tree: collection folders│ Breadcrumb · Save · overflow             │
│ + request rows (METHOD) │ Method · URL · Send                      │
│ Empty-folder card       │ Tabs: Params | Headers | Body | Triggers │
│                         │ ─────────────────────────────────────── │
│                         │ Response | History (journal)             │
└─────────────────────────┴─────────────────────────────────────────┘
```

- Layout is inspired by Postman; it is **not** a Postman feature clone (no Scripts/Auth/Cookies/Bulk Edit/nested folders).
- Light and dark themes share identical markup; colors use semantic tokens only.
- Settings content padding is cancelled so the workspace fills the leaf.

## Smart navigation state

```ts
type ExternalServicesSelection =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "collection"; collectionId: string }>
  | Readonly<{ kind: "request"; collectionId: string; requestId: string }>;
```

- Selection is ephemeral renderer state; persisted selection is unnecessary.
- Sidebar and workspace stay mounted together; switching selection updates the main pane.
- Unsaved request edits require discard confirmation before changing selection.
- Deleted selected items return to their valid parent (collection or none).
- Settings overlay remains mounted without replacing call context.

## Screen inventory

### Sidebar (collections tree)

- Header: COLLECTIONS label, New collection, Import collection.
- Expandable collection folders with overflow menu (rename, variables, duplicate, export, delete, new request).
- Request rows: method color badge + name; overflow (enable/disable, rename, duplicate, delete).
- Empty collection card: “Collection is empty” + New request.
- Global empty state: purpose copy + New collection / Import.

Test IDs:

```txt
external-services-workspace
external-services-collections
external-services-create-collection
external-services-import-collection
external-services-collection-{id}
external-services-collection-menu-{id}
external-services-request-{id}
```

### Collection workspace

- Shown when a collection is selected and no request is open.
- Breadcrumb with collection name; Variables action; New request.
- Empty-folder card when `requestCount === 0`.
- Otherwise: variables preview table + enabled count.
- Bottom pane: Response | History (journal).

Test IDs:

```txt
external-services-requests
external-services-create-request
external-services-collection-variables
```

### Request workspace

- Breadcrumb: collection › editable name; enabled Switch; Save; delete overflow.
- URL bar: method Select + URL Input + icon-only Send (`settings.integrations.external-services.send`); Send enabled when URL is non-empty.
- Tabs: Params (query table), Headers (count badge), Body (mode + editor), Triggers (event switches).
- Bottom pane: Response (run result / empty prompt) | History (journal).
- Unsaved changes require discard confirmation before selection change.

Test IDs:

```txt
external-services-request-editor
external-services-request-name
external-services-request-enabled
external-services-request-method
external-services-request-url
external-services-query-table
external-services-headers-table
external-services-body-mode
external-services-body-editor
external-services-trigger-{eventType}
external-services-save
external-services-run-now
external-services-run-result
external-services-response-pane
external-services-response-empty
external-services-discard-changes
```

### Journal (History tab)

- Latest 100 records, newest first in UI.
- Row summary: timestamp, request/collection snapshot names, event, outcome, status, duration.
- Expandable detail: URL, redacted headers, error, and truncated body.
- Empty state, loading state, load error with Retry.
- No rerun-from-journal or response-driven action in v1.

Test IDs:

```txt
external-services-journal-section
external-services-journal
external-services-journal-empty
external-services-journal-entry-{id}
external-services-journal-retry
```

## UX states

| State | Behavior |
| --- | --- |
| Loading | Skeleton/disabled mutation controls with translated reason. |
| Empty collections | Sidebar empty + welcome workspace; New collection / Import. |
| Empty requests | Empty-folder card in sidebar and collection workspace. |
| Load error | Alert + Retry; retain call shell and navigation. |
| Save pending | Disable duplicate submits; preserve draft. |
| Save error | Inline Alert; preserve all input. |
| Run queued | Send button loading; label indicates queued/running. |
| Run success | Response tab shows 2xx status, duration, body, truncation. |
| Run HTTP error | Response tab shows non-2xx status and body. |
| Run network/timeout error | Response tab shows category, duration, no fake status. |
| Invalid JSON | Warning near body and result; Send remains allowed. |
| Disabled collection/request | Fast toggles remain available; automatic-fire meaning is explained. |
| Pre-auth | Navigation disabled using existing account authorization reason. |
| Import conflict | Import as copy with regenerated IDs and explicit resulting name. |
| Dirty navigation | Discard confirmation before selection change. |

## UI Kit composition

Reuse current exports from `src/renderer/components/ui/index.ts`:

- `Button`, `IconButton`, `ButtonGroup`
- `Input`, `InputGroup`, `Textarea`, `FormField`, `Label`
- `Switch`, `Checkbox`, `Select`, `Tabs`
- `Dialog`, `AlertDialog`, `DropdownMenu`, `Tooltip`
- `Badge`, `Alert`, `Notification`, `Progress`
- `Table`, `Accordion`

Product-specific tree rows, key/value editors, response panes, and journal entries compose these primitives with CSS Modules and semantic tokens. If implementation discovers a missing generic primitive, stop that UI WU and propose a separate `/ui-kit` family before local duplication.

## Accessibility

- Every Switch has a visible label or controlled `aria-label`.
- Key/value table controls have row-specific labels and accessible remove actions.
- Method/body Select controls are connected through FormField or labelled inputs.
- Dialog/AlertDialog own focus, escape, outside-click, and restore behavior.
- Results use `role="status"` for completion and `role="alert"` only for actionable errors.
- Selection and destructive flows restore focus deterministically.
- Fast toggles expose enabled state in text, not color alone.
- Keyboard users can create, edit, save, run, and delete without pointer input.

## Theme and density

- All new styles use co-located `*.module.css`.
- Colors, borders, radius, shadows, spacing, motion, and focus use semantic tokens from the UI Kit visual canon.
- Light and dark use identical component markup/CSS.
- Reduced motion disables non-essential transitions.
- No Tailwind, hardcoded theme colors, global styles, CSS `filter`, or `brightness`.

## i18n namespace

Add typed keys for all `ru`, `en`, `fr`, `de`, `bg` catalogs under:

```txt
settings.integrations.externalServices.title
settings.integrations.externalServices.description
settings.integrations.externalServices.actions.*
settings.integrations.externalServices.collections.*
settings.integrations.externalServices.requests.*
settings.integrations.externalServices.editor.*
settings.integrations.externalServices.bodyMode.*
settings.integrations.externalServices.trigger.*
settings.integrations.externalServices.run.*
settings.integrations.externalServices.journal.*
settings.integrations.externalServices.validation.*
settings.integrations.externalServices.disabled.*
settings.integrations.externalServices.importExport.*
settings.integrations.externalServices.confirm.*
settings.integrations.externalServices.sidebar.*
settings.integrations.externalServices.workspace.*
settings.integrations.externalServices.tabs.*
```

No hardcoded visible copy, icon labels, placeholder text, status labels, or validation messages may exist in renderer/Application projections.

## Component split

Candidate product components:

```txt
src/renderer/components/settings/external-services/ExternalServicesPanel.tsx
src/renderer/components/settings/external-services/ExternalServicesSidebar.tsx
src/renderer/components/settings/external-services/ExternalServicesWelcome.tsx
src/renderer/components/settings/external-services/ExternalServicesRequestsView.tsx
src/renderer/components/settings/external-services/ExternalServicesRequestEditor.tsx
src/renderer/components/settings/external-services/ExternalServicesResponsePane.tsx
src/renderer/components/settings/external-services/ExternalServicesKeyValueTable.tsx
src/renderer/components/settings/external-services/ExternalServicesTriggerList.tsx
src/renderer/components/settings/external-services/ExternalServicesRunResult.tsx
src/renderer/components/settings/external-services/ExternalServicesJournal.tsx
src/renderer/components/settings/external-services/ExternalServicesCollectionsDialogs.tsx
src/renderer/hooks/useExternalServicesShell.ts
src/renderer/hooks/useExternalServicesActions.ts
src/renderer/hooks/useExternalServicesPanel.ts
```

Keep each component ≤150 lines and each hook ≤200 lines; split editor sections before budgets are exceeded.

## UI verification

- Component tests cover empty/loading/error, tree selection, validation, unsaved confirmation, Run states, redaction display, and journal cap rendering.
- Storybook covers workspace/editor/result/journal surfaces in light and dark without real facade/HTTP.
- `npm run i18n:check` and `npm run ui:catalog` pass.

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

## Smart navigation state

Use one product-local panel with explicit view state:

```ts
type ExternalServicesScreen =
  | Readonly<{ kind: "collections" }>
  | Readonly<{ kind: "requests"; collectionId: string }>
  | Readonly<{ kind: "request_detail"; collectionId: string; requestId: string }>;
```

- View state is ephemeral renderer navigation state; persisted selection is unnecessary.
- Browser-style Back returns detail → requests → collections and restores focus to the activating row.
- Deleted selected items return to their valid parent.
- Settings overlay remains mounted without replacing call context.

## Screen inventory

### Collections

- Header: title, short description, New collection, Import collection.
- Rows: name, enabled-request count Badge, collection Switch, open action, overflow menu.
- Menu: rename, duplicate, export, delete.
- Journal section is anchored at the bottom after all collection rows.
- Empty state composes existing UI Kit primitives locally; do not create a duplicate generic Card/EmptyState.

Test IDs:

```txt
external-services-collections
external-services-create-collection
external-services-import-collection
external-services-collection-{id}
external-services-collection-toggle-{id}
external-services-collection-enabled-count-{id}
external-services-collection-menu-{id}
external-services-journal-section
```

### Requests

- Breadcrumb/back, collection name, collection toggle, enabled count, New request.
- Flat rows: request name, method Badge, enabled/disabled Badge, fast Switch, open action, overflow menu.
- Menu: rename, duplicate, delete.
- Collection variables table appears above or in a dedicated Tabs section without nested folders.

Test IDs:

```txt
external-services-requests
external-services-create-request
external-services-request-{id}
external-services-request-toggle-{id}
external-services-request-status-{id}
external-services-collection-variables
```

### Request detail

- Header: back, editable name, enabled Switch, delete action.
- Form sections: method + URL; query table; headers table; body mode + editor; event trigger switches.
- Sticky action row: Save and Run now.
- Run result panel: success/error tone, status when available, duration, body, truncation marker, JSON validity warning.
- Unsaved changes require explicit discard confirmation before back/delete/navigation.

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
```

### Journal

- Latest 100 records, newest first in UI.
- Row summary: timestamp, request/collection snapshot names, event, outcome, status, duration.
- Expandable detail: URL, redacted headers, error, and truncated body.
- Empty state, loading state, load error with Retry.
- No rerun-from-journal or response-driven action in v1.

Test IDs:

```txt
external-services-journal
external-services-journal-empty
external-services-journal-entry-{id}
external-services-journal-retry
```

## UX states

| State | Behavior |
| --- | --- |
| Loading | Skeleton rows; mutation/run controls disabled with translated reason. |
| Empty collections | Explain purpose; primary New collection and secondary Import. |
| Empty requests | Explain collection is empty; primary New request. |
| Load error | Alert + Retry; retain call shell and navigation. |
| Save pending | Disable duplicate submits; preserve draft. |
| Save error | Inline Alert; preserve all input and focus first invalid field when applicable. |
| Run queued | Button loading; label indicates queued/running without claiming network start. |
| Run success | Show 2xx status, duration, body, truncation. |
| Run HTTP error | Show non-2xx status and body. |
| Run network/timeout error | Show category, duration, no fake status. |
| Invalid JSON | Warning near body and result; Run remains allowed. |
| Disabled collection/request | Fast toggles remain available; automatic-fire meaning is explained. |
| Pre-auth | Navigation disabled using existing account authorization reason. |
| Import conflict | Import as copy with regenerated IDs and explicit resulting name. |

## UI Kit composition

Reuse current exports from `src/renderer/components/ui/index.ts`:

- `Button`, `IconButton`, `ButtonGroup`
- `Input`, `InputGroup`, `Textarea`, `FormField`, `Label`
- `Switch`, `Checkbox`, `Select`, `Tabs`
- `Dialog`, `AlertDialog`, `DropdownMenu`, `Tooltip`
- `Badge`, `Alert`, `Notification`, `Progress`
- `Table`, `Accordion`

`Skeleton` and `Spinner` exist under `src/renderer/components/ui/skeleton/` and `spinner/` but are not currently exported by the root barrel; reuse their subfolder exports or add a generic barrel export through the UI Kit workflow.

Product-specific list rows, key/value editors, result panels, and journal entries compose these primitives with CSS Modules and semantic tokens. If implementation discovers a missing generic primitive, stop that UI WU and propose a separate `/ui-kit` family before local duplication.

## Accessibility

- Every Switch has a visible label or controlled `aria-label`.
- Key/value table controls have row-specific labels and accessible remove actions.
- Method/body Select controls are connected through FormField.
- Dialog/AlertDialog own focus, escape, outside-click, and restore behavior.
- Results use `role="status"` for completion and `role="alert"` only for actionable errors.
- Back/navigation and destructive flows restore focus deterministically.
- Fast toggles expose enabled state in text/Badge, not color alone.
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
```

No hardcoded visible copy, icon labels, placeholder text, status labels, or validation messages may exist in renderer/Application projections.

## Component split

Candidate product components:

```txt
src/renderer/components/settings/external-services/ExternalServicesPanel.tsx
src/renderer/components/settings/external-services/ExternalServicesCollectionsView.tsx
src/renderer/components/settings/external-services/ExternalServicesCollectionRow.tsx
src/renderer/components/settings/external-services/ExternalServicesRequestsView.tsx
src/renderer/components/settings/external-services/ExternalServicesRequestRow.tsx
src/renderer/components/settings/external-services/ExternalServicesRequestEditor.tsx
src/renderer/components/settings/external-services/ExternalServicesKeyValueTable.tsx
src/renderer/components/settings/external-services/ExternalServicesTriggerList.tsx
src/renderer/components/settings/external-services/ExternalServicesRunResult.tsx
src/renderer/components/settings/external-services/ExternalServicesJournal.tsx
src/renderer/hooks/useExternalServicesShell.ts
src/renderer/hooks/useExternalServicesActions.ts
```

Keep each component ≤150 lines and each hook ≤200 lines; split editor sections before budgets are exceeded.

## UI verification

- Component tests cover empty/loading/error, row toggles/counts, navigation/back/focus, validation, unsaved confirmation, Run states, redaction display, and journal cap rendering.
- Storybook covers critical collections/editor/result/journal surfaces in light and dark without real facade/HTTP.
- `npm run i18n:check` and `npm run ui:catalog` pass.

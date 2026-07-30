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

- Header: COLLECTIONS label, icon-only New collection (`+`), Import collection (visible hover on surface-alt).
- Expandable collection folders; quick-add `+` left of overflow menu; overflow (rename, variables, duplicate, export, delete, new request).
- Request children have **no left indent**; compact method badge font; overflow (enable/disable, rename dialog, duplicate, delete).
- Empty collection card: “Collection is empty” + New request.
- Global empty state: centered vertically/horizontally + New collection / Import.

Test IDs:

```txt
external-services-workspace
external-services-collections
external-services-create-collection
external-services-import-collection
external-services-collection-{id}
external-services-collection-add-{id}
external-services-collection-menu-{id}
external-services-request-{id}
```

### Collection workspace

- Shown when a collection is selected and no request is open.
- Breadcrumb: click-to-edit collection name (text → sized input → blur commits rename).
- Variables action; New request.
- Empty-folder card centered when `requestCount === 0`.
- Otherwise: variables preview table + enabled count.
- Bottom pane: Response | History (journal) with expand/collapse toggle.

Test IDs:

```txt
external-services-requests
external-services-collection-name
external-services-create-request
external-services-collection-variables
```

### Request workspace

- Breadcrumb: collection › click-to-edit request name (blur commits); enabled Switch; Save; delete overflow.
- Sidebar rename opens rename dialog (request scope); breadcrumb rename persists immediately.
- URL bar: method Select + URL Input + icon-only Send (`settings.integrations.external-services.send`); Send enabled when URL is non-empty.
- Tabs: Params / Headers / Triggers show `(N)` for enabled/selected counts when N > 0; Body uses horizontal radio body-mode selector (none/json/urlencoded/raw only).
- Compact key/value rows for Params and Headers (narrow inputs + compact Add row).
- Triggers list uses padded card layout under tabs.
- Bottom pane: taller Response | History with collapse/expand icon toggle.
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
external-services-body-mode-{mode}
external-services-body-editor
external-services-triggers
external-services-trigger-{eventType}
external-services-save
external-services-run-now
external-services-run-result
external-services-response-pane
external-services-response-pane-toggle
external-services-response-empty
external-services-discard-changes
```

### Journal (History tab)

- No duplicate “Journal” heading/description under History tab (tab label is enough).
- Compact single-line collapsed summary: time · names · badges · status · duration.
- Latest 100 records, newest first in UI.
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

### Create / rename dialogs

- Create collection dialog title is **only** “Collection name” (no separate “New collection” title); title and input have spacing.
- Rename collection / rename request use dedicated titles; request rename from sidebar menu opens the dialog.

### Workspace polish (2026-07-30 follow-up)

- Empty workspace welcome shows only the centered select prompt.
- Response/History pane height is drag-resizable (`external-services-response-resize`) and collapsible.
- Request rows show an absolute top-left enabled/disabled status dot; overflow menu actions are Enable/Disable (not state labels).
- Compact fixed-width Params/Headers key/value fields; body editor hidden when mode is `none`.
- Method badge ↔ request name gap tightened; `⋯` menu trigger matches quick-add hover treatment.

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

- Product-specific tree rows, key/value editors, body-mode radios, inline breadcrumb rename, response panes, and journal entries compose these primitives with CSS Modules and semantic tokens.
- Body-mode uses a **local** accessible radio group (not a new UI Kit Radio family). Propose `/ui-kit` Radio only if another product surface needs the same primitive.
- If implementation discovers another missing generic primitive, stop that UI WU and propose a separate `/ui-kit` family before local duplication.

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

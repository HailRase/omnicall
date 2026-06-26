# Enterprise Softphone UI Architecture

## Type

DOCUMENT.

Canonical guide for Electron + React renderer structure. Complements `UX-UI-Design-Blueprint.md` (what to show) and `UI-Design-System.md` (visual stack) with how to wire UI safely.

## Renderer Layers

Current folders (incremental migration; see FSD mapping):

```txt
bootstrap/     composition root, URL/env reads (infrastructure allowed)
stores/        event → projection reducers only (read models)
shells/        feature widgets: compose hooks, pass props to components
hooks/         Shell hooks + Actions hooks (facade / Use Cases)
helpers/       reason codes → user-visible strings
components/    presentational UI only (props in, callbacks out)
styles/        tokens.css, globals.css; co-located *.module.css (UI-4 complete)
```

**`entities/` does not exist in renderer.** UI view-models come from `@application` `derive*` / projection types. Widget-local UI state only in `widgets/<name>/model.ts` if ever needed.

## FSD Mapping (hybrid, not dogma)

| FSD layer | This repo | Notes |
| --- | --- | --- |
| app | `bootstrap/`, `App.tsx`, `stores/` | composition + global read models |
| pages | `App` + `SoftphoneReadyShell` | single desktop surface |
| widgets | `shells/`, `SoftphoneLayout` | may keep `shells/` name in docs |
| features | `hooks/use*Shell`, `hooks/use*Actions` | co-locate per feature when refactoring |
| entities | **absent** | Domain/Application own entities |
| shared | `helpers/`, future `shared/ui/` primitives | no facade imports |

## Data Flow

```txt
Domain Event → Application projection reducer → Zustand store
  → Shell hook → Presentational component
User action → component callback → Actions hook → Facade / Use Case
```

Config-only settings (no business rules): `Actions hook → facade.update*Settings() → port → store projection refresh` — **no Use Case**.

## Layout & Navigation

`SoftphoneLayout` (widget — see `UI-Design-System.md`):

```txt
HeaderZone      — status, registration, global actions
ContextZone     — lines, active card, errors (never unmount on settings open)
ControlsZone    — dialpad, active controls
OverlayLayer    — incoming, campaign, settings sheet, diagnostics, recovery
PanelNav        — Call | History only (History full-screen when idle, no active call)
```

**Call-center rule:** Settings and Diagnostics open as **overlays**, not full panel replacement, while a call is established. Operator must keep line context.

Modal flows (Radix Dialog v1): incoming call, campaign. Settings v1: portal `Panel` without Radix.

## Hook Taxonomy

| Kind | Responsibility | Must not |
|------|----------------|----------|
| `useXxxShell` | visibility, labels, disabled reasons, ephemeral UI (`settingsOpen`) | call Use Cases |
| `useXxxActions` | guards + `facade.*` / Use Case execute | own layout / render |
| `useAccountBootstrap` | start composition, bind store, expose facade | contain feature UI |

Reference pair: `useConnectionRecoveryShell` + `useConnectionRecoveryActions`.

## Presentational Component Contract

Components receive:

- projection / shell view-model fields
- disabled reasons (string or null)
- callbacks (`onHold`, `onSubmit`, …)

Components must not receive or call:

- `AccountBootstrapFacade`
- adapters, repositories, SIP, raw IPC
- `derive*` / domain transition helpers

Document components via JSDoc `@uiMeta` + Storybook; catalog: `npm run ui:catalog`.

## Allowed Imports In Renderer

| From | Allowed |
|------|---------|
| `@application` | projections, derive functions, facade **types**, view-models |
| `@shared` | result helpers, shared types |
| `@infrastructure` | bootstrap / composition only (`bootstrap/`, `useAccountBootstrap`) |
| `@domain` | **forbidden** |
| `@adapters` / `@ports` | **forbidden** (including components) |

### ESLint enforcement

`src/renderer/components/**` and future `shared/ui/**`:

- forbid `@adapters`, `@ports`, `**/facades/**`, `**/use-cases/**`
- `src/renderer/hooks/**/*Actions.ts` — facade imports allowed

## Feature Shell Pattern

`App.tsx` stays a thin shell (< 60 lines). Feature wiring lives in `src/renderer/shells/`:

- `SoftphoneReadyShell` — post-bootstrap orchestration inside `SoftphoneLayout`
- `SoftphoneShellHeader` — global header controls
- `RecoveryFeatureShell` — connection loss overlay
- `SessionFeatureShell` — logout banner and confirmation modal
- `CallFeatureShell` — split target: Context + Controls + Overlays widgets
- `OperatorFeatureShell` — status selector, timer, logout modal
- `AuthAccountShell` — account panel when auth allows

Shells may use hooks and facades; components inside shells remain dumb.

## Store Selectors

Use `useSoftphoneProjections()` for all Zustand projection slices and UI setters.
Do not duplicate store selectors across shells.

## Shell Chrome

Use `useSoftphoneShellChrome({ facade })` in `App` for header-level recovery and session logout hooks.
Pass `sessionLogoutActions` into `SoftphoneReadyShell` so header and modal share one hook instance.

## Composition Root

Renderer bootstrap lives in `src/renderer/bootstrap/createRendererComposition.ts`.
`useAccountBootstrap` binds the facade to the store; it must not contain feature UI.

## Disabled Controls

Disabled state and reason must come from Application projections or `derive*` helpers — never from component-local business guesses.

## Dev vs Prod UI

- No dev-only diagnostic copy in production UI (`sip-registered-hint` removed).
- Diagnostics overlay — DEV or `?debug=1`.

## Multi-Line UI Unification

- Primary interactive list: `CallLinesShell` + `CallLineRow` (P11 WU2).
- `MultiLineCallList` (transfer read-only) → migrate to shared `CallLineRow` with optional action slot.

## UX Before Code

Before a new visible component:

1. Read affected `LF-XXX`, Feature Registry, phase UX doc.
2. List states (loading, error, disabled, recovery).
3. Define props and callbacks mapping to Use Cases or facade settings methods.
4. Implement projection first, then shell hook, then component.
5. Add Storybook story for critical surfaces; run `ui:catalog`.

Use skill: `.cursor/skills/ux-ui-flow-design/SKILL.md`.

## UI Implementation Phases (P11 WU0+)

See `UI-Design-System.md` — **UI-4 foundation live** (`tokens.css`, `globals.css`, CSS Modules mandatory for touched components). Incremental migration: `P11-CSS-Modules-Tokens-Migration.md`, agent prompt `handoffs/P11-WU5-CSS-Modules-Tokens-Agent-Prompt.md`.

Handoff: `docs/softphone/handoffs/P11-WU0-Shell-Layout-Agent-Prompt.md`.

## RAT / Smoke Coupling

Manual smoke requires usable shell. After UI-2, `multiSessionsEnabled` toggle replaces temp `InMemorySettingsRepository` hacks (R7-5). See `real-integration/UI-SMOKE-ENABLERS.md`.

## Completion Check

UI change is complete when:

- components stay presentational
- no `@domain` imports in renderer
- actions go through facade / Use Cases (or facade settings for config flags)
- `data-testid` and a11y preserved
- Storybook updated for touched primitives (when UI-5+ started)
- `npm run ui:catalog` if components/testids changed
- **CSS:** new/touched components use `*.module.css` + tokens only (`P11-CSS-Modules-Tokens-Migration.md`)
- tests pass

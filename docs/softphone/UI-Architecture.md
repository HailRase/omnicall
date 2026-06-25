# Enterprise Softphone UI Architecture

## Type

DOCUMENT.

Canonical guide for Electron + React renderer structure. Complements `UX-UI-Design-Blueprint.md` (what to show) with how to wire UI safely.

## Renderer Layers

```txt
bootstrap/     composition root, URL/env reads (infrastructure allowed)
stores/        event → projection reducers only (read models)
shells/        feature containers: compose hooks, pass props to components
hooks/         Shell hooks (derive UI flags) + Actions hooks (facade / Use Cases)
helpers/       reason codes → user-visible strings
components/    presentational UI only (props in, callbacks out)
```

## Data Flow

```txt
Domain Event → Application projection reducer → Zustand store
  → Shell hook → Presentational component
User action → component callback → Actions hook → Facade / Use Case
```

## Hook Taxonomy

| Kind | Responsibility | Must not |
|------|----------------|----------|
| `useXxxShell` | visibility, labels, disabled reasons, ephemeral UI state (modal open) | call Use Cases |
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

## Allowed Imports In Renderer

| From | Allowed |
|------|---------|
| `@application` | projections, derive functions, facade **types**, view-models |
| `@shared` | result helpers, shared types |
| `@infrastructure` | bootstrap / composition only (`bootstrap/`, `useAccountBootstrap`) |
| `@domain` | **forbidden** |
| `@adapters` / `@ports` | **forbidden** |

## Feature Shell Pattern

`App.tsx` stays a thin shell (< 60 lines). Feature wiring lives in `src/renderer/shells/`:

- `SoftphoneReadyShell` — post-bootstrap global UI orchestration
- `SoftphoneShellHeader` — global header controls (re-register, end session)
- `RecoveryFeatureShell` — connection loss overlay
- `SessionFeatureShell` — logout banner and confirmation modal
- `CallFeatureShell` — dialpad, active call, transfer, incoming
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

## UX Before Code

Before a new visible component:

1. Read affected `LF-XXX` and phase UX doc.
2. List states (loading, error, disabled, recovery).
3. Define props and callbacks mapping to Use Cases.
4. Implement projection first, then shell hook, then component.

Use skill: `.cursor/skills/ux-ui-flow-design/SKILL.md`.

## Completion Check

UI change is complete when:

- components stay presentational
- no `@domain` imports in renderer
- actions go through facade / Use Cases
- `data-testid` and a11y preserved
- tests pass

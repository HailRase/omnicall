# Enterprise Softphone UI Design System

## Type

DOCUMENT.

Visual and composition rules for the Electron renderer. Complements `UI-Architecture.md` (wiring) and `UX-UI-Design-Blueprint.md` (product states).

## Stack (2026)

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | React 19 | Existing |
| State read-model | Zustand projections | Not replaced |
| Styling | **CSS Modules** + semantic tokens | Default; Tailwind only if team ADR |
| Primitives a11y | **@radix-ui/react-dialog** | Incoming + campaign modals only (v1) |
| Motion | **framer-motion** | Presentational; wraps Radix content |
| Class merge | **clsx** | Conditional classes |
| Docs / visual contract | **Storybook 8** | 5–7 critical stories |
| Catalog | `npm run ui:catalog` | Generated from sources |

## Design Tokens

File: `src/renderer/styles/tokens.css` (to be created in UI-1).

Semantic names only:

- `--color-surface-primary`, `--color-surface-elevated`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-danger`
- `--color-border-subtle`, `--color-accent-primary`
- `--space-xs` … `--space-xl`
- `--radius-control`, `--radius-panel`
- `--z-overlay`, `--z-modal`, `--z-toast`

Migrate values from legacy `styles.css` without visual redesign in UI-1.

## Primitives (`shared/ui/` — target)

| Primitive | Role |
| --- | --- |
| `Button`, `IconButton` | primary / danger / ghost |
| `Panel` | bordered sections |
| `Stack`, `Inline` | layout |
| `Text`, `Hint`, `ErrorText` | typography |
| `Badge` | status, hold, mute |
| `Modal` | Radix Dialog + motion wrapper |
| `DisabledHint` | projection-driven disabled copy |
| `ControlGroup` | active-call button row |

Primitives: visual + a11y only. No facade, no store, no Use Cases.

## Layout Widget

`SoftphoneLayout` zones (never unmount Context during call):

```txt
HeaderZone     — registration, phone status, global actions
ContextZone    — call lines, active card, policy banners
ControlsZone   — dialpad, active controls
OverlayLayer   — modals and sheets (z-index stack)
PanelNav       — Call | History only (History full-screen in idle)
```

**Settings** and **Diagnostics**: overlay sheets in `OverlayLayer`, not panel swap. ContextZone stays visible (min. collapsed strip during established call).

## Radix Scope (v1)

| Surface | Radix Dialog | Motion |
| --- | --- | --- |
| Incoming call | yes | yes |
| Campaign modal | yes | yes |
| Settings overlay | no (portal Panel v1) | optional fade |
| Diagnostics (dev) | no | no |
| Connection overlay | existing component | later |

Motion rules:

1. Do not replace Radix focus trap.
2. Animate only from `isOpen` / `visible` props (shell hook).
3. No motion on dialpad key press (instant feedback).

## Component Documentation

- **No hand-maintained `.ui.md` files.**
- JSDoc tag `@uiMeta` on exported components (optional): `lf=LF-021 f=F-003 smoke=R7-1`
- `data-testid` in component source.
- Storybook story per primitive / critical widget.
- Regenerate `docs/softphone/UI-Component-Catalog.md` via `npm run ui:catalog`.

## Settings Write Path

Config flags (e.g. `multiSessionsEnabled`): **no Use Case** unless business rules appear.

```txt
UI → useSettingsActions → facade.updateMultiCallSettings()
  → SettingsRepository.setMultiCallSettings()  (port extension)
  → store projection refresh (setMultiCallSettings helper)
```

UI must not import `@ports` or repositories.

## ESLint (renderer components)

`src/renderer/components/**` and future `shared/ui/**`:

- forbid `@adapters`, `@ports`, `**/facades/**`, `**/use-cases/**`
- `*Actions.ts` hooks exempt (facade calls allowed)

See `eslint.config.js` and `UI-Architecture.md`.

## Implementation Phases

| Phase | Deliverable |
| --- | --- |
| UI-1 | `SoftphoneLayout` + zones; remove dev hints |
| UI-2 | Settings overlay + `multiSessionsEnabled` (unblocks R7-5 without repo hack) |
| UI-3 | Split `CallFeatureShell`; unify `CallLineRow` |
| UI-4 | tokens + CSS Modules migration |
| UI-5 | Storybook stories + catalog script |
| UI-6 | Radix Dialog + motion on incoming/campaign |
| UI-7 | Diagnostics overlay (`import.meta.env.DEV` or `?debug=1`) |

## Related

- `UI-Architecture.md` — layers, hooks, FSD mapping
- `UX-UI-Design-Blueprint.md` — product states
- `handoffs/P11-WU0-Shell-Layout-Agent-Prompt.md` — first implementation WU

# Enterprise Softphone UI Design System

## Type

DOCUMENT.

Visual and composition rules for the Electron renderer. Complements `UI-Architecture.md` (wiring) and `UX-UI-Design-Blueprint.md` (product states).

## Stack (2026)

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | React 19 | Existing |
| State read-model | Zustand projections | Not replaced |
| Styling | **CSS Modules** + semantic tokens | Mandatory; see `P11-CSS-Modules-Tokens-Migration.md` (UI-4 **complete**) |
| Primitives a11y | **@radix-ui/react-dialog** | Incoming + campaign modals only (v1) |
| Motion | **framer-motion** | Presentational; wraps Radix content |
| Class merge | **clsx** | Conditional classes |
| Tooltip positioning | **@floating-ui/react-dom** | `IconTooltip` portal + flip/shift |
| Icons | **lucide-react** + **lucide-animated** via `AppIcon` | See [`guides/Icon-Agent-Guide.md`](../../guides/Icon-Agent-Guide.md), `Icon-Registry.md` |
| Docs / visual contract | **Storybook 8** | 5–7 critical stories |
| Catalog | `npm run ui:catalog` | Generated from sources |

## Language

- Supported interface locales: `ru` (default) and `en` (first international locale).
- Localization architecture and decision: `docs/softphone/adr/ADR-0006-interface-internationalization.md`.
- Enforcement rule: `.cursor/rules/i18n.mdc` (mandatory for UI/UI-facing logic changes).
- Technical identifiers stay English (`data-testid`, reason keys, domain event names, projection keys).

## Design Tokens

File: `src/renderer/styles/tokens.css` (semantic variables on `:root` for **light** default; `[data-theme="dark"]` overrides).

Globals: `src/renderer/styles/globals.css` (reset, body, focus ring).

Component styles: co-located `*.module.css` (UI-4 complete; legacy `styles.css` removed).

**Themes (LF-082):** default `light`; user selects `light` | `dark` in Settings → General; applied via `data-theme` on `documentElement`. All new UI must work in both themes using semantic tokens only.

Semantic names only:

- `--color-surface-primary`, `--color-surface-elevated`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-danger`
- `--color-border-subtle`, `--color-accent-primary`
- `--space-xs` … `--space-xl`
- `--radius-control`, `--radius-panel`
- `--z-overlay`, `--z-shell-modal-overlay`, `--z-shell-status-banner` (OCP reconnect banner above Settings), `--z-modal`, `--z-toast`
- Shell chrome (frameless titlebar): `--shell-titlebar-controls-height`, `--shell-window-controls-safe-inline-start`, `--shell-window-controls-safe-inline-end`, `--incoming-call-banner-top`

Migrate values from legacy globals without visual redesign in UI-1 (done via WU5).

### Shell always-on-top pin (F-016)

- Pin control sits **centered** in the window-controls cluster on Win/Linux/macOS.
- Icons: `shell.window.pin` / `shell.window.unpin` (Lucide `Pin` / `PinOff`).
- Active pin: `aria-pressed="true"`, accent color + subtle tint (`window-control-button-pin-active`).
- Ownership: Electron main `setAlwaysOnTop`; renderer projects state via IPC; persists `UserSettings.windowAlwaysOnTop`.
- Must not fight ADR-0013 raise pulse (pulse restores prior pin).

### Floating UI vs window controls (mandatory)

Frameless shell owns custom window controls (Win/Linux trailing buttons; macOS traffic lights). Any **fixed** toast, banner, or compact overlay that can sit in a top corner **must** clear that chrome on all platforms:

| Token / helper | Use |
| --- | --- |
| `--incoming-call-banner-top` | Vertical inset below titlebar (shared by incoming call, update banner, OCP connection banner, top toasts) |
| `--shell-window-controls-safe-inline-start` | Horizontal inset for macOS traffic lights when the floating UI occupies the titlebar |
| `--shell-window-controls-safe-inline-end` | Horizontal inset for Win/Linux window buttons when the floating UI occupies the titlebar |
| `resolveNotificationToasterOffset` | Product Sonner `offset` **and** `mobileOffset`; top toasts use the shared vertical inset and the normal 24px horizontal edge, because they render below titlebar controls |

Do **not** rely on Sonner’s default `mobileOffset` (16px) in the softphone shell. Prefer corner geometry over Sonner’s mobile full-bleed when the host is a narrow desktop window. `NotificationViewport.module.css` must also clamp the toaster and each toast to `100vw - 48px`; the compact shell is 360–420px, so a fixed Sonner width must never overflow during window-layout transitions.

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

**Settings** and **Diagnostics**: overlay sheets in `OverlayLayer`, not panel swap. ContextZone stays visible during established call.

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

## Settings Nav Groups

Applies to `SettingsSidebar` when `SETTINGS_NAV_TREE` contains a `group` (today: Integrations = OCP + External Services + External Applications).

- **Collapsed icon rail:** group renders as one icon (same centering as other leaves — no `nav-group` column layout while collapsed); children hidden; click → first enabled child; fully gated group uses soft disabled + reason tooltip.
- **Expanded flyout:** always-open cluster — muted sentence-case section label + child rows aligned with top-level items (same icon column / padding / active rail). No accordion, chevron, nested inset card, or extra left indent under the parent icon. No `text-transform: uppercase` on group labels.
- **Cluster separator:** the first top-level leaf after a group (OmniCall Kit) gets a top border + spacing so it does not read as a cluster child.
- **Chrome toggle:** click on empty sidebar chrome (outside `data-settings-nav-interactive` / tooltip hosts) toggles expand/collapse; nav item clicks never toggle.
- **Disabled:** soft muted color (not hard opacity collapse); `pointer-events: none` on the control; tooltip on the wrap; hover on wrap may show a subtle surface for tooltip affordance without looking enabled.
- **OmniCall Kit:** top-level leaf below Integrations (ADR-0018) — never a group child.
- **Canon refs:** ADR-AF-004 §4; Feature Registry F-016 / F-028 / F-031 / F-032; `SettingsSidebar.test.tsx`.

Do **not** reintroduce accordion collapse for ≤4 siblings. Prefer content-area tabs/hub only if a future group exceeds cluster density in the narrow settings rail.

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
| UI-4 | tokens + CSS Modules migration (**complete** WU5 2026-06-25) |
| UI-5 | Storybook stories + catalog script |
| UI-6 | Radix Dialog + motion on incoming/campaign |
| UI-7 | Diagnostics overlay (`import.meta.env.DEV` or `?debug=1`) |

## Related

- `UI-Architecture.md` — layers, hooks, FSD mapping
- `UX-UI-Design-Blueprint.md` — product states
- `handoffs/P11-WU0-Shell-Layout-Agent-Prompt.md` — first implementation WU

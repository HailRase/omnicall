# P11 WU3 — Header, Avatar, Collapsed Shell UX Design

Phase **P11 WU3**. Legacy-inspired compact header strip and collapse behavior.

Related: **LF-011**, **LF-076**, **LF-086** (avatar partial), collapse (P11 roadmap item 5/10). Feature: **F-016**.

## Decision log

| # | Topic | Decision |
|---|--------|----------|
| 1 | Collapse scope | UI-local `collapsed` flag in shell hook; no Domain / repository persistence in WU3. |
| 2 | Strip size | Collapsed shell height **~56px** header bar + minimal ContextZone strip; ControlsZone hidden. |
| 3 | Registration visibility | `RegistrationStatusDot` on avatar (LF-011 compact); full `PhoneStatusBadge` only when expanded. |
| 4 | Avatar menu | Placeholder avatar with initials only; user menu deferred (LF-086 partial). |
| 5 | Active call in collapse | `CallLineRow` **`compact`** variant: name, timer, primary CTA; ContextZone stays mounted. |
| 6 | Settings entry | Header Settings/Diagnostics buttons remain in collapsed bar (LF-076). |
| 7 | Operator status | `OperatorFeatureShell` hidden when collapsed; expand to change status. |

## State inventory

| State | Projection inputs | UI |
|-------|-------------------|-----|
| Expanded idle | `authUiState`, registration | Full header, `PhoneStatusBadge`, dialpad visible |
| Expanded registered | `sip_registered`, lines empty | Header dot green/online; dialpad enabled |
| Collapsed with call | `deriveCallLinesShell.lines.length >= 1` | 56px header + compact line strip; dialpad hidden |
| Registering | `sip_registering` / `registrationState: registering` | Amber dot; `aria-busy` on dot |
| Registration failed | `sip_registration_failed` / `failed` | Red dot; label in `title` tooltip |
| DND registered | `phoneStatus: dnd`, registered | Orange dot |
| Blocking recovery | `connectionRecoveryShell.isBlocking` | Overlay unchanged (WU2 regression) |

## Wireframe

### Expanded header

```txt
┌─ HeaderZone ─────────────────────────────────────────────┐
│ [AV●] Enterprise Softphone          [Settings][Diag][▾]  │
│ [Re-register] [End session]                                 │
│ PhoneStatusBadge (Online / Registration / status buttons)   │
│ OperatorFeatureShell                                        │
└────────────────────────────────────────────────────────────┘
```

### Collapsed (~56px + context strip)

```txt
┌─ shell (collapsed) ──────────────────────────────────────┐
│ [AV●]  [⚙][Diag][▴]                                        │
├─ ContextZone (min strip) ──────────────────────────────────┤
│ Alice · 1:05 · On line                        [Hang up]    │
└────────────────────────────────────────────────────────────┘
(ControlsZone hidden)
```

## Components and callbacks

| Component | Props | Callbacks |
|-----------|-------|-----------|
| `UserAvatar` | `initials`, `ariaLabel?` | `onClick?` (deferred menu) |
| `RegistrationStatusDot` | `variant`, `label` | — |
| `SoftphoneShellHeader` | `headerChrome`, `collapsed`, recovery/session shells | `onToggleCollapse`, `onOpenSettings`, `onOpenDiagnostics` |
| `CallLineRow` | `compact?: boolean` | existing line callbacks |
| `SoftphoneLayout` | `collapsed?: boolean` | — |

View-model: `deriveHeaderChromeShell` in `@application` (registration dot variant, labels, initials).

## Test IDs

| ID | Element |
|----|---------|
| `shell-header` | Header root |
| `user-avatar` | Avatar button/span |
| `registration-status-dot` | Status dot |
| `control-toggle-collapse` | Collapse/expand toggle |
| `control-open-settings` | Settings (existing) |
| `control-open-diagnostics` | Diagnostics (existing) |
| `softphone-layout--collapsed` | Layout root class marker via `data-collapsed` |

## Accessibility

- Collapse toggle: `aria-expanded`, `aria-label` Expand/Collapse softphone.
- Registration dot: `aria-label` includes human registration + phone status label.
- Avatar: `aria-label` with account initials; not a menu until LF-086 full.
- Compact call row: primary action remains keyboard reachable.

## Manual smoke

1. Toggle collapse: active call line + timer remain visible; dialpad hidden.
2. Dot reflects registering / registered / failed.
3. Settings overlay from collapsed header; ContextZone mounted.
4. Blocking recovery overlay still blocks clicks.

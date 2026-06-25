# P11 WU5 Slice I — Panels And Modals CSS Modules Handoff

- Scope: **Slice I** — components with global `className` but no legacy CSS in `styles.css`.
- Feature: **F-016** (UI-4 incremental).

## Delivered

| Component | Module |
| --- | --- |
| Shared dialog chrome | `DialogPanel.module.css` |
| `TransferPanel` | `TransferPanel.module.css` |
| `MultiLineCallList` | `MultiLineCallList.module.css` |
| `StatusSelector` | `StatusSelector.module.css` |
| `BreakReasonPicker` | `BreakReasonPicker.module.css` |
| `StatusTimer` | `StatusTimer.module.css` |
| `OcpToastStack` | `OcpToastStack.module.css` |
| `CampaignEventModal` | `CampaignEventModal.module.css` + `DialogPanel` |
| `LogoutReasonModal` | `DialogPanel.module.css` |
| `LogoutActiveSessionConfirmationModal` | `DialogPanel.module.css` |
| `CallControlsShell` | `CallControlsShell.module.css` |

Panel pattern: `var(--*)` tokens, no raw colors; parity with existing migrated panels.

## Next

UI-4 final gate: move `focus-visible` to `globals.css`, remove `styles.css` bridge, update `main.tsx` / Storybook imports.

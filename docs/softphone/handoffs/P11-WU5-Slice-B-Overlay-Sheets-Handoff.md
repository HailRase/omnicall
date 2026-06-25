# P11 WU5 Slice B — Overlay Sheets CSS Modules Handoff

- Scope: **Slice B** — `SettingsOverlay`, `ShellOverlaySheet` → co-located `*.module.css`; remove overlay globals from `styles.css`.
- Feature: **F-016** (UI-4 incremental).
- Token added: `--color-overlay-scrim` in `tokens.css`.

## Delivered

| Area | Path |
| --- | --- |
| Settings | `SettingsOverlay.module.css`, `SettingsOverlay.tsx` |
| Shell sheet | `ShellOverlaySheet.module.css`, `ShellOverlaySheet.tsx` |
| Legacy cleanup | Removed `.settings-overlay*`, `.shell-overlay-sheet*` from `styles.css` |

## Gate WU5 Slice B

- [x] Touched components use CSS Modules
- [x] No new globals in `styles.css`
- [x] Migrated globals removed
- [x] Tokens only (scrim via `--color-overlay-scrim`)
- [x] Tests pass

## Verification

694 passed, 1 skipped; lint, typecheck, `ui:catalog` — OK.

## Next slice

**Slice C:** `CallLineRow.tsx` — `.call-line-row*`.

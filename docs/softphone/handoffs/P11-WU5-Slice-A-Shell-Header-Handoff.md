# P11 WU5 Slice A — Shell Header CSS Modules Handoff

- Scope: **Slice A** — `SoftphoneShellHeader` → `SoftphoneShellHeader.module.css`; remove `.shell__header*` globals from `styles.css`.
- Feature: **F-016** (UI-4 incremental).
- Baseline: 694 tests (WU4 closed).

## Delivered

| Area | Path |
| --- | --- |
| Module | `src/renderer/shells/SoftphoneShellHeader.module.css` |
| Component | `src/renderer/shells/SoftphoneShellHeader.tsx` (`clsx`, token vars) |
| Legacy cleanup | Removed `.shell__header*`, `.shell__avatar-group`, `.shell__reregister` from `styles.css` |
| Docs | `P11-CSS-Modules-Tokens-Migration.md` — Slice A marked done |

## Gate WU5 Slice A

- [x] `SoftphoneShellHeader` uses CSS Modules
- [x] No new globals in `styles.css`
- [x] Migrated globals removed
- [x] Tokens only in module (no raw colors)
- [x] Tests pass (`SoftphoneShellHeader.test.tsx`)

## Verification

```bash
npm run test && npm run lint && npm run typecheck && npm run ui:catalog
```

694 passed, 1 skipped.

## Next slice

**Slice B:** `SettingsOverlay.tsx`, `ShellOverlaySheet.tsx` — `.settings-overlay*`, `.shell-overlay-sheet*`.

Repeat WU5 per slice until `styles.css` is empty (UI-4 complete).

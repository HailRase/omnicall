# P11 WU5 Slice C — Call Line Row CSS Modules Handoff

- Scope: **Slice C** — `CallLineRow` → `CallLineRow.module.css`; remove `.call-line-row*` from `styles.css`.
- Feature: **F-016** (UI-4 incremental).

## Gate WU5 Slice C

- [x] `CallLineRow` uses CSS Modules + `clsx`
- [x] Migrated globals removed from `styles.css`
- [x] Tokens only in module
- [x] Tests pass (including compact variant)

## Next slice

**Slice D:** `Dialpad.tsx` — `.dialpad*`.

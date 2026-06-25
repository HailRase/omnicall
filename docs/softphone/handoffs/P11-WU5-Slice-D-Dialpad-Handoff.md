# P11 WU5 Slice D — Dialpad CSS Modules Handoff

- Scope: **Slice D** — `Dialpad` → `Dialpad.module.css`; remove `.dialpad*` from `styles.css`.
- Feature: **F-016** (UI-4 incremental).

## Gate WU5 Slice D

- [x] `Dialpad` uses CSS Modules + `clsx`
- [x] Migrated globals removed (including shared `.dialpad button` rules)
- [x] Tokens only in module
- [x] Tests pass (8 Dialpad tests)

## Next

Continue incremental migration: `ActiveCallControlsPanel`, `OutgoingCallCard`, modals, layout shells until `styles.css` is empty.

# P11 WU5 Slice F — ConnectionOverlay CSS Modules Handoff

- Scope: **Slice F** — `ConnectionOverlay` → `ConnectionOverlay.module.css`; remove `.connection-overlay*` from `styles.css`.
- Feature: **F-016** (UI-4 incremental), **LF-057** blocking scrim.

## Delivered

| Item | Detail |
| --- | --- |
| Component | `ConnectionOverlay.tsx` + `ConnectionOverlay.module.css` |
| Token | `--color-overlay-scrim-strong` (`rgb(8 12 20 / 65%)`) in `tokens.css` |
| Removed globals | `.connection-overlay*`, `.connection-overlay-host*` (~106 lines) |

## Gate WU5 Slice F

- [x] `ConnectionOverlay` uses CSS Modules + `clsx`
- [x] Migrated globals removed from `styles.css`
- [x] Tokens only in module (no raw colors)
- [x] All `data-testid` preserved
- [x] Tests pass (9 ConnectionOverlay tests)

## Next

Slice G: layout shell (`App.tsx`, `SoftphoneLayout`), then auth panels (Slice H), unstyled modals (Slice I+).

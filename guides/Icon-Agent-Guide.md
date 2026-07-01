# Icon Agent Guide

Single entry point for UI agents working with icons in the Enterprise Softphone renderer.

## Packages

| Package | Role |
| --- | --- |
| `lucide-react` | Static icons — full Lucide set, tree-shakeable |
| `lucide-animated` | Animated icons — smaller curated set; **prefer when available** |
| `motion` | Peer dependency for `lucide-animated` |

## Mandatory workflow

1. Read [`docs/softphone/Icon-Registry.md`](../docs/softphone/Icon-Registry.md) before adding or changing icons.
2. Use semantic id via `AppIcon` from `src/renderer/components/icons/` — **never** import Lucide directly in feature components.
3. Pick animated variant when listed in registry; otherwise static `lucide-react` via catalog.
4. Register every new icon in **both** `iconCatalog.ts` and `Icon-Registry.md` with `usage` paths.
5. Icon-only controls: parent `button` keeps `aria-label`; icon is `decorative`; use `IconControlButton` for delayed hover tooltip.

## Tooltips

`IconControlButton` wraps `IconTooltip` — 1s delay; instant when `prefers-reduced-motion: reduce`.

## Files

| Path | Purpose |
| --- | --- |
| `src/renderer/components/icons/AppIcon.tsx` | Presentation wrapper |
| `src/renderer/components/icons/iconCatalog.ts` | Semantic id → static/animated mapping |
| [`docs/softphone/Icon-Registry.md`](../docs/softphone/Icon-Registry.md) | Human/agent registry (source of truth for usage) |
| `.cursor/rules/icons.mdc` | Mandatory agent rule |
| `.cursor/skills/icons/SKILL.md` | Step-by-step skill |

## Tokens

Use `var(--icon-size-sm|md|lg)` from `tokens.css` for default sizes.

## Status values

| Status | Meaning |
| --- | --- |
| `planned` | Catalog entry exists; UI not wired yet |
| `active` | Rendered in component |
| `deprecated` | Do not use; ADR required to remove |

## Related

- [`docs/softphone/UI-Design-System.md`](../docs/softphone/UI-Design-System.md) — stack + tokens
- [`docs/softphone/P11-CSS-Modules-Tokens-Migration.md`](../docs/softphone/P11-CSS-Modules-Tokens-Migration.md) — styling rules
- [`docs/softphone/handoffs/P11-Icon-Tooltips-Agent-Prompt.md`](../docs/softphone/handoffs/P11-Icon-Tooltips-Agent-Prompt.md) — tooltip WU (done 2026-06-25)

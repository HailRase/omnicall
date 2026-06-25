---
name: icons
description: SKILL - Use when adding or changing UI icons in the Enterprise Softphone renderer (Lucide static + animated).
---

# SKILL: UI Icons

Use before wiring icons in `components/`, `shells/`, or `widgets/`.

## Inputs

- UI component and control purpose
- `docs/softphone/Icon-Registry.md`
- `src/renderer/components/icons/iconCatalog.ts`

## Outputs

- Updated registry row (status `planned` or `active`)
- Updated `iconCatalog.ts` entry
- `AppIcon` usage in presentation component

## Procedure

1. Read `Icon-Agent-Guide.md` and registry.
2. Define semantic id (`<domain>.<action>`) or reuse existing.
3. Search `lucide-animated` exports; if missing, use `lucide-react` only in catalog.
4. Add registry row + `ICON_CATALOG` entry with `usage` paths.
5. Render via `<AppIcon id="..." decorative />` inside labeled `button` / link.
6. Run `npm run typecheck` and `npm run lint`.
7. Set registry status `active` when icon is rendered.

## Animation

- Default `preferAnimated={true}` on `AppIcon`.
- `animateOnHover` is set by wrapper; respect `prefers-reduced-motion` (library default).

## Accessibility

- Decorative in buttons: parent has `aria-label` matching registry `defaultLabel`.
- Standalone informative icon: `decorative={false}` + `label`.

## Tooltips

Use `IconControlButton` (wraps `IconTooltip`, 1s delay).

## Out of scope

- Business logic, SIP, Electron APIs

## Related

- `.cursor/rules/icons.mdc`
- `UI-Design-System.md`

# P11 CSS Modules And Design Tokens

Related: **F-016**, UI phase **UI-4**. **Complete** 2026-06-25 (WU5 slices A–I + final gate).

## Stack (mandatory for renderer UI)

| Layer | Path | Rule |
| --- | --- | --- |
| Tokens | `src/renderer/styles/tokens.css` | Semantic `--color-*`, `--space-*`, `--radius-*`, `--z-*` only |
| Globals | `src/renderer/styles/globals.css` | Reset, body, `focus-visible`; imported in `main.tsx` and Storybook |
| Component styles | `ComponentName.module.css` co-located with TSX | **Required** for new or touched components |

`src/renderer/styles.css` **deleted** — no legacy global stylesheet.

## Agent rules (every UI WU)

1. **New or modified** `src/renderer/components/**`, `src/renderer/shells/**`, `src/renderer/widgets/**` → CSS Module + tokens; use `clsx` for variants.
2. **Never** add raw hex/rgb in module CSS — only `var(--token)`.
3. **Never** reintroduce a global component stylesheet; use co-located modules.
4. Import pattern: `import styles from "./Foo.module.css"`; use `styles["className"]` (project `noPropertyAccessFromIndexSignature`).
5. Keep `data-testid` on DOM nodes (unchanged by CSS Modules).
6. Icons: `AppIcon` + `Icon-Registry.md` (see `.cursor/rules/icons.mdc`).
7. Run `npm run test`, `npm run lint`, `npm run typecheck`; update Storybook if component has a story.

## Migration (WU5) — complete

| Slice | Area |
| --- | --- |
| foundation | `tokens.css`, `globals.css`, `UserAvatar`, `RegistrationStatusDot` |
| A–I | See handoffs `P11-WU5-Slice-A` through `P11-WU5-Slice-I` |
| gate | `focus-visible` → `globals.css`; `styles.css` removed |

## Token reference

See `src/renderer/styles/tokens.css` and `UI-Design-System.md` § Design Tokens.

## Verification

```bash
npm run test && npm run lint && npm run typecheck
npm run ui:catalog
```

## Related

- `UI-Design-System.md`, `UI-Architecture.md`, `guides/Icon-Agent-Guide.md`
- `handoffs/P11-WU5-UI-4-Final-Gate-Handoff.md`

# P11 CSS Modules And Design Tokens

Related: **F-016**, UI phase **UI-4**. Foundation introduced 2026-06-25.

## Stack (mandatory for renderer UI)

| Layer | Path | Rule |
| --- | --- | --- |
| Tokens | `src/renderer/styles/tokens.css` | Semantic `--color-*`, `--space-*`, `--radius-*`, `--z-*` only |
| Globals | `src/renderer/styles/globals.css` | Reset + body; imported in `main.tsx` and Storybook |
| Component styles | `ComponentName.module.css` co-located with TSX | **Required** for new or touched components |
| Legacy | `src/renderer/styles.css` | Shrinking; **no new global classes** |

## Agent rules (every UI WU)

1. **New or modified** `src/renderer/components/**` and `src/renderer/shells/**` → CSS Module + tokens; use `clsx` for variants.
2. **Never** add raw hex/rgb in module CSS — only `var(--token)`.
3. **Never** add new selectors to `styles.css`; migrate touched globals into a module and delete the global block in the same WU.
4. Import pattern: `import styles from "./Foo.module.css"`; use `styles["className"]` (project `noPropertyAccessFromIndexSignature`).
5. Keep `data-testid` on DOM nodes (unchanged by CSS Modules).
6. Run `npm run test`, `npm run lint`, `npm run typecheck`; update Storybook if component has a story.

## Migration order (incremental)

| Priority | Area | Notes |
| --- | --- | --- |
| done | `UserAvatar`, `RegistrationStatusDot` | Pilot modules (WU5 foundation) |
| done | `SoftphoneShellHeader` | Slice A — header chrome module (WU5) |
| done | `SettingsOverlay`, `ShellOverlaySheet` | Slice B — overlay sheets (WU5) |
| done | `CallLineRow` | Slice C — call line row (WU5) |
| done | `Dialpad` | Slice D — dialpad panel (WU5) |
| done | `ActiveCallControlsPanel`, `OutgoingCallCard`, `IncomingCallModal`, `IncomingCallActions` | Slice E — call panels + incoming modal (WU5) |
| next | `ConnectionOverlay`, modals, layout shells | remaining `styles.css` blocks |
| last | Delete `styles.css` when empty | Gate UI-4 complete |

## Token reference

See `src/renderer/styles/tokens.css` and `UI-Design-System.md` § Design Tokens.

## Verification

```bash
npm run test && npm run lint && npm run typecheck
npm run ui:catalog
```

No visual redesign in migration WUs — parity with legacy `styles.css` values.

## Related

- `UI-Design-System.md`, `UI-Architecture.md`
- `handoffs/P11-WU5-CSS-Modules-Tokens-Agent-Prompt.md`

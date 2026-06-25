# Renderer styles

- Purpose: global tokens, reset, and co-located CSS Modules for components.
- Inputs: semantic `tokens.css`; component `*.module.css` beside TSX.
- Outputs: CSS variables on `:root`; hashed module class names at build time.
- Entry: `globals.css` + legacy `styles.css` until UI-4 migration completes.
- Rule: new or touched components use Modules + tokens only; no new globals in `styles.css`.

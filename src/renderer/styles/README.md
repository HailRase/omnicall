# Renderer styles

- Purpose: global tokens, reset, focus ring; co-located CSS Modules for components.
- Inputs: semantic `tokens.css`; component `*.module.css` beside TSX.
- Outputs: CSS variables on `:root`; hashed module class names at build time.
- Entry: `globals.css` (imported in `main.tsx` and Storybook).
- Rule: components use Modules + tokens only; no legacy global stylesheet.
- Icons: `components/icons/AppIcon` + `docs/softphone/Icon-Registry.md`.

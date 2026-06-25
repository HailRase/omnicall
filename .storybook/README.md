# Storybook

Visual contract for renderer primitives and critical widgets.

## Commands

```bash
npm run storybook       # dev server :6006
npm run build-storybook # static build
```

## First stories (implementation agent)

1. `shared/ui/Button.stories.tsx` (after Button primitive)
2. `components/dialpad/Dialpad.stories.tsx`
3. `components/call/CallLineCard.stories.tsx`

Import global styles via `.storybook/preview.ts`.

## Rules

- Stories use mock props only; no facade, no Zustand store.
- Match `data-testid` from production components.
- Add `@uiMeta` to component JSDoc; run `npm run ui:catalog`.

See `docs/softphone/UI-Design-System.md`.

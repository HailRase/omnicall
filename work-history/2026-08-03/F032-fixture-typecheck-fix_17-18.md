# F-032: fixture typecheck follow-up

**Дата:** 2026-08-03 17:18
**Статус:** выполнено
**Коммит:** `7527a89`

## Где
- `src/renderer/components/settings/panels/settingsIntegrationsTestDefaults.ts`
- `src/renderer/components/settings/external-applications/ExternalApplicationsEditor.tsx`
- `src/renderer/hooks/useExternalApplicationsPanel.test.tsx`

## Что
- В test/story defaults добавлены `isDirty` / discard handlers
- Save button: `variant="primary"` вместо невалидного `"default"`
- Типизация `find` callbacks в panel hook test

## Зачем
- Убрать регрессию `tsc -p tsconfig.web.json` после dirty-draft props

## Результат
- `tsc --noEmit -p tsconfig.web.json` ok; related vitest 5/5 passed; pushed to `main`

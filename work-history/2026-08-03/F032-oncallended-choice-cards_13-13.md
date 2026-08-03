# F-032 illustrated onCallEnded choice cards

**Дата:** 2026-08-03 13:13
**Статус:** выполнено
**Коммит:** `1abfc00`

## Где
- `src/renderer/components/settings/external-applications/OnCallEndedChoiceCards.tsx`
- `src/renderer/components/settings/external-applications/OnCallEndedSchematics.tsx`
- `src/renderer/components/settings/external-applications/OnCallEndedSchematicParts.tsx`
- `src/renderer/components/settings/external-applications/onCallEndedOptions.tsx`
- `src/renderer/components/settings/external-applications/OnCallEndedChoiceCards.module.css`
- `src/renderer/components/settings/external-applications/ExternalApplicationsWindowBehavior.tsx`
- `src/renderer/components/settings/external-applications/ExternalApplicationsGeneralTab.tsx`
- `src/renderer/components/settings/external-applications/ExternalApplicationsPanel.test.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `UI-Component-Catalog.md`

## Что
- Заменён `Select` для `onCallEnded` на illustrated RadioGroup-карточки leave / minimize / close
- Добавлены desktop-scene SVG с post-call outcomes и CSS-motion (с `prefers-reduced-motion`)
- Секция window behavior показывается только при `openMode === electron_window`
- Краткие i18n-подсказки под switches raiseOnOpen / alwaysOnTop
- Обновлены panel-тесты, Feature Registry F-032, I18N-Coverage, UI catalog

## Зачем
- Оператору проще понять исход окна после звонка до выбора, по тому же принципу, что openMode cards

## Результат
- `npx vitest run …/ExternalApplicationsPanel.test.tsx` — 8/8 PASS
- `npm run i18n:check` — PASS
- `npm run ui:catalog` — обновлён каталог
- Version bump / commit не выполнялись

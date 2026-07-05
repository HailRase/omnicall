# Codec preferences UI T-009

**Дата:** 2026-07-05 18:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsCodecsPanel.tsx`
- `src/renderer/components/settings/panels/CodecPreferencesSortableList.tsx`
- `src/renderer/hooks/useSettingsActions.ts` — codec callbacks
- `src/application/settings/mapCodecPreferenceMutationError.ts`
- `src/application/settings/deriveCodecCheckboxDisabled.ts`
- `package.json` — `@dnd-kit/*`
- `docs/softphone/Feature-Registry.md` — F-022 implemented
- `docs/softphone/TASK-QUEUE.md` — T-009 done

## Что
- Двухколоночная панель Audio/Video с checkboxes и `@dnd-kit` drag-drop
- Сохранение через `useSettingsActions` → `facade.saveUserSettings()` + domain validate
- i18n ru/en/fr/de для кодеков и ошибок мутаций
- Storybook `CodecsSection`; unit-тесты панели и хука
- F-022 / LF-084 UI gate закрыт

## Зачем
Пользовательская настройка порядка и включения кодеков (LF-084) после adapter WU-4.

## Результат
- `npm run test` — 1100 passed, 1 skipped
- `npm run lint` / `typecheck` / `i18n:check` — green
- Следующий шаг: `/preflight` → `/review` gate F-022

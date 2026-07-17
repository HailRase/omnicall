# Overwrite modal: Cancel + ButtonGroup split

**Дата:** 2026-07-17 11:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/OverwriteSavedAccountCredentialsConfirmationModal.tsx`
- `src/renderer/components/account/OverwriteSavedAccountCredentialsConfirmationModal.module.css`
- `src/renderer/components/account/OverwriteSavedAccountCredentialsConfirmationModal.test.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- Footer модалки «Обновить сохранённые данные?» сжат: Cancel + `ButtonGroup` (primary «Продолжить без сохранения» + dropdown «Перезаписать»)
- Во время overwrite-loading primary показывает loader «Перезаписать», меню отключено
- i18n aria-ключи для group/меню во всех локалях (ru/en/fr/de/bg)
- Компонентные тесты split-actions + loader; обновлены Registry / STATUS / catalog

## Зачем
- Три текстовые кнопки не помещались по ширине AlertDialog (~360–400px); нужен компактный split-паттерн UI Kit

## Результат
- `npm run test` — 2172 passed / 1 skipped
- `npm run lint`, `typecheck`, `i18n:check`, `ui:catalog` — green
- TASK-QUEUE T-035 → done

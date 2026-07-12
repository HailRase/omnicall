# Улучшение модалки трансляции экрана

**Дата:** 2026-07-12 23:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/ScreenSharePickerDialog.tsx`
- `src/renderer/components/call/ScreenSharePickerDialog.module.css`
- `src/renderer/hooks/useScreenSharePicker.ts`
- `src/renderer/i18n/messages.ts`
- `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- Перевёл picker в полноэкранный режим (`Dialog` size fullscreen) с адаптивным layout и увеличенной сеткой превью источников.
- Отключил закрытие модалки по ESC/клику вне и убрал крестик, оставив выход только через `Отмена` или успешный выбор/запуск шаринга.
- Добавил третий таб `Google Chrome` без изменения capture-контракта: фильтрация оконных источников по имени окна Chrome.
- Обновил локализации для `ru/en/fr/de/bg` (описание и новый таб picker).
- Расширил тесты `ScreenSharePickerDialog` и `useScreenSharePicker` под новый таб и сценарий выбора Chrome-источника.
- Уточнил acceptance в `Feature-Registry` для нового UX табов picker.

## Зачем
- Улучшить UX в режиме `Минимальный` и `На весь экран`, чтобы список источников нормально помещался и был удобен для выбора.
- Добавить ожидаемый пользователем сценарий выбора вкладок Google Chrome без даунгрейда текущей логики screen/window capture.

## Результат
- Целевые тесты: `npm run test -- ScreenSharePickerDialog useScreenSharePicker` — успешно.
- Проверка i18n: `npm run i18n:check` — успешно.
- Диагностика линтера по изменённым файлам (`ReadLints`) — ошибок нет.

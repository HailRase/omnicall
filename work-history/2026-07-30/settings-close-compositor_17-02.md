# Мгновенное закрытие Settings

**Дата:** 2026-07-30 17:02
**Статус:** выполнено
**Коммит:** `cdb8d0e`

## Где
- `src/main/shellWindow/`, `src/renderer/components/settings/`, `src/renderer/hooks/`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/UI-Architecture.md`

## Что
- Удалён GPU transition cover и его lifecycle.
- Settings→compact отправляет layout с длительностью `0ms`.
- Overlay немедленно размонтируется при закрытии Settings.
- Сохранены compact restore и maximized no-snap.
- Обновлён F-016 contract и тест сервиса layout.

## Зачем
- Убрать неудачную визуальную анимацию и переключать окно без motion.

## Результат
- Targeted tests (18), typecheck, i18n и registry check: PASS.
- Lint изменённых файлов: PASS.

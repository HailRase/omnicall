# System State layout: server/registration + inline actions

**Дата:** 2026-07-02 15:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx`
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.module.css`
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.test.tsx`

## Что
- «Автовосстановление» разделено на подсекции **Сервер** и **Регистрация** с заголовками
- Ручные действия перенесены в «Текущее состояние»: сокет → переподключение, регистрация → перерегистрация/обновление
- Отдельная секция «Ручные действия» удалена; feedback остаётся над панелью состояния
- Тесты на группировку и привязку кнопок к строкам состояния

## Зачем
Запрос пользователя: логическая группировка настроек и действий по осям сервер/регистрация.

## Результат
- `npm run test` (panel) — 12 passed
- `npm run lint` — ok
- `npm run typecheck` — ok

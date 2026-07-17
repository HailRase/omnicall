# Account copy, OCP login picker, notification actions

**Дата:** 2026-07-17 15:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/notifications/NotificationToastAction.tsx`
- `src/renderer/components/notifications/NotificationToast.module.css`
- `src/renderer/components/notifications/useNotificationSonnerSync.ts`
- `src/renderer/components/ui/sonner/Sonner.module.css`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`, `locales/bg-strings.json`
- shells/hooks/settings panels wiring for removed props

## Что
- Убраны подписи «Сохранить имя пользователя…», «Сначала включите «Сохранить профиль»» и «Пароль будет сохранён в защищённом хранилище Windows» (ключи удалены из всех локалей)
- В OCP-режиме на вкладке «Новый» убран picker «Выбрать» у поля логина; placeholder упрощён
- Кнопка action в Sonner-уведомлениях больше не сжимает текст: message получает `flex:1`, кнопка ограничена, текст переносится/clamp + tooltip поверх toast (`z-toast` снижен с Sonner default)

## Зачем
- Убрать лишний copy у чекбоксов профиля и возможность выбирать сохранённый логин на вкладке «Новый»
- Исправить вёрстку длинных action-кнопок в уведомлениях

## Результат
- `npx vitest run` (AccountPanel, NotificationViewport, SettingsAccountPanel, useAccountActions, Sonner) — OK
- `npm run i18n:check` — OK
- `npx tsc --noEmit -p tsconfig.web.json` — OK
- Дополнение: description «Запомнить пароль» убран без новых тестов

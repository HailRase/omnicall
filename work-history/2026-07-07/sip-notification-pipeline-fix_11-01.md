# SIP-only unified notifications fix

**Дата:** 2026-07-07 11:01
**Статус:** выполнено
**Коммит:** `—`

## Где
- `src/renderer/hooks/useActionNotifications.ts`
- `src/renderer/hooks/useNotifications.ts`
- `src/renderer/components/notifications/useNotificationSonnerSync.ts`
- `src/renderer/hooks/useActionNotifications.test.ts`
- `src/renderer/hooks/useNotifications.test.ts`
- `src/renderer/components/notifications/NotificationViewport.test.tsx`
- `src/renderer/components/settings/panels/SettingsGeneralPanel.test.tsx`

## Что
- Убрал зависимости эффектов от нестабильных объектов в action-notifications, оставил зависимости на стабильные callbacks и отдельные поля.
- Добавил seen-guard для account success/warning/error с сигнатурой ключа и параметров, плюс reset guard при `null`.
- Зафиксировал sticky update prompt: `durationMs: 0`, `closable: true`, сохранены `action` и `onClose`.
- Добавил сравнение эквивалентности notification item в очереди, чтобы same-id/same-descriptor не триггерил лишнюю замену.
- Обновил Sonner sync lifecycle: suppression очищается после удаления item, повторный тот же id после удаления снова показывается, close callbacks не дублируются.
- Расширил тесты для dedupe, sticky/action поведения, language update, и controls в settings panel.

## Зачем
- Устранить риск render loop и дублирующих side-effects в unified pipeline уведомлений для SIP-only пути.
- Сохранить runtime-настройки уведомлений и предотвратить регресс sticky/action уведомлений.

## Результат
- `npm run test -- --run src/renderer/hooks/useActionNotifications.test.ts src/renderer/hooks/useNotifications.test.ts src/renderer/components/notifications/NotificationViewport.test.tsx src/renderer/components/settings/panels/SettingsGeneralPanel.test.tsx` ✅
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run i18n:check` ⚠️ падает на существующем `FormField.tsx` (`FormField children must be a single React element`), вне скоупа текущих изменений.

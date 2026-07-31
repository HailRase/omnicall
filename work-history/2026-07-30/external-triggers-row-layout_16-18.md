# Layout строк triggers

**Дата:** 2026-07-30 16:18
**Статус:** выполнено
**Коммит:** `e2dbf9a`

## Где
- `src/renderer/components/settings/external-services/ExternalServicesTriggerList.tsx`
- `src/renderer/components/settings/external-services/ExternalServices.module.css`
- `src/renderer/components/settings/external-services/ExternalServicesRequestsEditor.test.tsx`

## Что
- Название trigger слева, контролы прижаты вправо
- Порядок справа: задержка, затем switcher вкл/выкл
- Поле задержки рендерится только при включённом trigger
- В тесте добавлена проверка видимости delay при активном binding

## Зачем
- Выровнять UX списка «Автоматические события» по привычному паттерну: label слева, действия справа

## Результат
- Layout triggers исправлен
- `npx vitest run …ExternalServicesRequestsEditor.test.tsx -t "emits editor field"` — pass

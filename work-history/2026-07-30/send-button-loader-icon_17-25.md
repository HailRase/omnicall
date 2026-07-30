# Send button loader replaces icon

**Дата:** 2026-07-30 17:25
**Статус:** выполнено
**Коммит:** `cdb8d0e`

## Где
- `src/renderer/components/settings/external-services/ExternalServicesRequestUrlBar.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesRequestsEditor.test.tsx`

## Что
- При `runState !== idle` Send не рендерит AppIcon — остаётся только spinner из Button
- Добавлен тест: idle = svg, running = spinner без svg

## Зачем
- Loader должен заменять иконку отправки, а не стоять рядом с ней

## Результат
- `npx vitest run …/ExternalServicesRequestsEditor.test.tsx` — 17 passed

# UI polish внешних приложений

**Дата:** 2026-07-31 14:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/ExternalApplications.module.css`
- `src/renderer/components/settings/external-applications/ExternalApplicationsEditor.tsx`
- `src/renderer/components/settings/external-services/ExternalServices.module.css`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Icon-Registry.md`

## Что
- Кнопка Open: иконка Lucide `ExternalLink` (`settings.integrations.external-applications.open`)
- Фикс вкладки «Переменные»: `display:flex` больше не перебивает `[hidden]` у неактивных TabsContent
- Индикаторы enabled/disabled: `--color-status-online` / `--color-status-failed`, крупнее и контрастнее

## Зачем
- Исправить визуальные баги по скриншоту пользователя

## Результат
- `vitest` ExternalApplicationsPanel — pass
- `npm run typecheck` — pass
- Animated `ExternalLinkIcon` отсутствует в `lucide-animated@1.0.x` → static ExternalLink

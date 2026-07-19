# Polish модалки «Вход в модуль OCP»

**Дата:** 2026-07-19 20:13
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/OcpSignInProgress.tsx`
- `src/renderer/components/account/OcpSignInProgressStatusIcon.tsx`
- `src/renderer/components/account/OcpSignInProgress.module.css`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Icon-Registry.md`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- Исправлены несуществующие spacing/typography tokens; Dialog `md`, каноничные отступы
- Иконки статусов этапов (completed/active/pending/failed/timeout) через AppIcon + lucide-animated
- Inline Alert с текстом ошибки; Reconnect с disabledReason tooltip
- Footer: outline Disconnect в progress / destructive при failure; Reconnect primary
- Тесты и i18n ru/en/fr/de/bg

## Зачем
- Довести UX модалки входа OCP до commercial-grade: воздух, иерархия, явная ошибка и иконки статусов.

## Результат
- `vitest` OcpSignInProgress + i18n parity — pass
- `eslint` + `stylelint` + `tsc` — green
- `i18n:check` падает на несвязанном `UserHeaderIdentity.tsx` (pre-existing)

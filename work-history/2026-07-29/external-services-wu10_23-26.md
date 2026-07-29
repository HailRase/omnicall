# F-031 WU-10 — Journal UI

**Дата:** 2026-07-29 23:26
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/integration/deriveExternalServicesJournalPanel.ts`
- `src/renderer/hooks/useExternalServicesJournal.ts`
- `src/renderer/components/settings/external-services/ExternalServicesJournal.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesJournalEntry.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `external-services-plan/PROGRESS.md`, `docs/softphone/handoffs/P14-External-Services-Master-Handoff.md`

## Что
- Добавлен Application VM журнала (cap 100, newest-first, уже отредacted headers)
- Встроен Accordion-журнал в низ списка коллекций с empty/loading/error/retry
- Расширяемые детали: URL, headers (`***`), error, body, truncation marker
- i18n ru/en/fr/de/bg + projection/component tests + light/dark Storybook
- Обновлены registry, handoff, STATUS, I18N-Coverage, PROGRESS

## Зачем
- Пользователь видит исходы автоматизаций без replay/control и без утечки protected headers.

## Результат
- `npx vitest run` (journal projection + journal/collections UI) PASS
- `npm run typecheck` PASS
- `npm run i18n:check` PASS
- `npm run ui:catalog` PASS
- targeted eslint PASS
- Next: `Implement WU-11 from external-services-plan/10-WORK-UNITS.md`

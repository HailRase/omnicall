# SIP journal clear immediate UI update

**Дата:** 2026-07-04 18:47
**Статус:** выполнено
**Коммит:** `fix(settings): clear SIP journal immediately in system state panel`

## Где
- `src/application/services/SipConnectionJournal.ts`
- `src/renderer/hooks/useSipSystemStateActions.ts`

## Что
- `getEntries()` возвращает копию массива, а не внутренний буфер
- `refreshJournal()` всегда кладёт новый массив в React state
- Тест snapshot-copy после `clear()`

## Зачем
Кнопка «Очистить журнал» очищала данные, но UI обновлялся только после следующего SIP-события/тика.

## Результат
- `npm run test` (SipConnectionJournal) — pass
- `npm run typecheck` — green
- Push: `feature/real-adapters`

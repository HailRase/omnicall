# Select outbound connecting call

**Дата:** 2026-07-10 14:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/telephony/deriveCallLinesShell.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/hooks/useCallLineRowShell.ts`
- `docs/softphone/Feature-Registry.md` (F-003)

## Что
- Outbound `Ringing`/`Connecting` → `primaryAction: hangup` (не `answer`)
- `answer` только для waiting incoming
- Клик по исходящему выбирает сессию, а не пытается answer
- Incoming-restore effect только при реальном конце incoming (не на каждый tick)

## Зачем
- После выбора Held нельзя было снова выбрать исходящий в Connecting/ringback

## Результат
- `npx vitest run src/application/projections/telephony/deriveCallLinesShell.test.ts` — 7 passed

# Replace jssip with @hailrase/jssip

**Дата:** 2026-06-24 14:50
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json`, `package-lock.json`
- `src/adapters/telephony/jssip/createJsSipUserAgent.ts`
- `src/adapters/telephony/jssip/wrapJsSipRtcSession.ts`

## Что
- Зависимость `jssip` заменена на `@hailrase/jssip@^3.10.2`
- Обновлены импорты в двух adapter-файлах с прямым require пакета
- `npm install` обновил lockfile (удалён `jssip`, добавлен scoped fork)

## Зачем
Использовать форк JsSIP под организацией HailRase вместо upstream `jssip`.

## Результат
- `npm run test` — 544 passed, 1 skipped
- `npm run lint` / `typecheck` — green
- Прямых импортов `jssip` в коде не осталось

# DTMF error UI fix + JsSIP sendDtmf

**Дата:** 2026-06-29 13:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/callProjection.ts`
- `src/renderer/shells/call/CallContextShell.tsx`
- `src/renderer/components/call/DtmfKeypadPanel.tsx`
- `src/adapters/telephony/jssip/executeJsSipSendDtmf.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`

## Что
- Ошибки DTMF вынесены в отдельное поле `lastDtmfError`, не смешиваются с `lastError` звонка
- `OutgoingCallCard` больше не появляется при сбое DTMF
- Ошибка DTMF показывается в `DtmfKeypadPanel` на русском, без технических сообщений
- Реализован `JsSipTelephonyAdapter.sendDtmf` через `session.sendDTMF`
- Добавлены unit-тесты projection, adapter и UI

## Зачем
При вводе DTMF stub-адаптер возвращал «not implemented», projection писал это в `lastError`, и UI показывал failed-карточку исходящего звонка вместо тонового набора.

## Результат
`npm run test` — 800 passed, 1 skipped; `npm run lint` и `npm run typecheck` — OK.

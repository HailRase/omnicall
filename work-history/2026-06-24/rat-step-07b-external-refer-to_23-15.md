# RAT step 07b external Refer-To

**Дата:** 2026-06-24 23:15
**Статус:** выполнено (код + тесты; manual smoke A–D pending)
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/buildBlindReferTarget.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `docs/softphone/adr/ADR-0003-sbc-refer-semantics.md`
- `docs/softphone/real-integration/PROGRESS.md`

## Что
- Добавлен `buildBlindReferTarget` / `classifyReferTargetKind`: on-net → `sip:n@domain`, off-net → `tel:n`
- `blindTransfer` использует refer-specific target; `makeCall` без изменений
- ADR-0003: секция external Refer-To + smoke evidence
- Unit tests (+9): `buildBlindReferTarget.test.ts`, adapter external E.164 case
- PROGRESS / SMOKE / Feature Registry обновлены

## Зачем
Исправить blind transfer на внешние номера (smoke B/C FAIL) без регрессии internal ext (A/D PASS).

## Результат
`npm run test` 594 passed, 1 skipped; lint/typecheck green. Manual smoke matrix A–D — pending на dev SBC.

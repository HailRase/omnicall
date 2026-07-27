# SDK Typing DX (integrator types)

**Дата:** 2026-07-27 11:19
**Статус:** выполнено
**Коммит:** `f689950`

## Где
- `axatalk-sdk/packages/protocol/src/operator-status.ts`
- `axatalk-sdk/packages/sdk/src/public/protocol-reexports.ts`
- `axatalk-sdk/packages/sdk/src/internal/client-error-details.ts`
- `axatalk-sdk/docs/guide/typescript.md`
- `axatalk-sdk/etc/api/sdk.api.md`, `protocol.api.md`
- `docs/softphone/Feature-Registry.md` (F-011 note)

## Что
- Общий `PublicOperatorStatus` в protocol; ужесточены result DTO activate/operator
- Re-export snapshot/capability/error DTO из `@axata/axatalk-sdk`
- `AxatalkEventOf`, typed error readers/guards; JSDoc на публичной поверхности
- Guide `typescript.md`, inventory sync без hardcoded count; example CRM на helpers
- `npm run preflight` PASS (sdk **77** symbols / protocol **190**)

## Зачем
- Сделать типизацию понятной для внешних разработчиков без ломки runtime/security контракта

## Результат
- Аддитивные type/DX изменения; product commands и privilege strip без ослабления
- Проверка: `cd axatalk-sdk && npm run preflight` → PASS

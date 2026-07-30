# F-031 review High/Low cleanup

**Дата:** 2026-07-30 22:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useExternalServicesPanel.ts`
- `src/renderer/hooks/externalServicesPanel/*`
- `docs/softphone/STATUS.md`, `I18N-Coverage.md`, `Feature-Registry.md`, P14/P11 handoffs
- `external-services-plan/11-ACCEPTANCE.md`

## Что
- Разрезан `useExternalServicesPanel` на composition hooks + builders без смены поведения.
- Снят residual file-budget в acceptance; обновлены registry/handoff.
- I18N-Coverage: ключи template autocomplete; STATUS: LF-060 done, F-031 gate PASS.

## Зачем
- Закрыть High/Low из `/review` F-031 без багов и downgrade.

## Результат
- Focused ES tests 44 passed; `npm run typecheck` PASS; eslint on new hooks PASS.

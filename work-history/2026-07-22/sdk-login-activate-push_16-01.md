# Commit и push SDK login activate

**Дата:** 2026-07-22 16:01
**Статус:** выполнено
**Коммит:** `099d0c9`

## Где
- `src/shared/integration/sdkAccountLogin.ts`
- `src/application/integration/ExternalSdkAccountHandler.ts`
- `src/adapters/integration/sdkAccountActivateSession.ts`
- `src/renderer/components/integration/SdkActivateProfileConsentModal.tsx`
- `axatalk-sdk/`, `docs/softphone/`, `work-history/2026-07-22/`

## Что
- Закоммичены все изменения login/activate (без temporary grants)
- Удалён `sdkAccountActivateGrantStore` и Settings Grant section
- Добавлен `sdkAccountLogin` + consent/login flow
- Запушено в `origin/feature/axatalk-sdk`

## Зачем
- Пользователь запросил закоммитить всё и запушить текущую работу по SDK activate.

## Результат
- Коммит `099d0c9` на ветке `feature/axatalk-sdk`
- Push успешен: `a68db64..099d0c9`
- Working tree clean

# System State: сервер вместо сокета, удаление force refresh

**Дата:** 2026-07-02 15:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx`
- `src/application/projections/deriveSipSystemStateShell.ts`
- `src/application/use-cases/ForceRefreshSipRegistrationUseCase.ts` (удалён)
- `src/ports/telephony/TelephonyGateway.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/mock/MockTelephonyGateway.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useSipSystemStateActions.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- «Сокет» → «Сервер» во всех пользовательских строках панели «Состояние системы»
- Удалена кнопка «Обновить регистрацию» и весь стек: Use Case, порт, адаптеры, facade, projection field
- Обновлены тесты и Feature Registry F-014/F-016

## Зачем
Запрос пользователя: единая терминология «сервер» и отказ от force refresh как неиспользуемого действия.

## Результат
- `npm run test` — 1014 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok

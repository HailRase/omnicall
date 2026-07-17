# Account OCP/SIP mode-isolated validation

**Дата:** 2026-07-17 11:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/accountSignInCommand.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/use-cases/settings/PersistDraftAccountArtifactsUseCase.ts`
- `src/renderer/hooks/accountActionsHelpers.ts`
- `src/renderer/hooks/useAccountActions.ts`
- docs: `Feature-Registry.md` (F-028), `TASK-QUEUE.md` (T-036), `STATUS.md`, `Legacy-Feature-Coverage.md` (LF-006)

## Что
- Валидация OCP больше не смотрит на SIP-поля и не падает из‑за пустого SIP-пароля/server
- `buildAccountSignInCommand` для OCP берёт identity из OCP draft; `rememberPassword` без boundary SIP-пароля не уходит в команду
- Persist draft soft-skip для пустого SIP-пароля при наличии `ocpDomain`; Facade OCP persist выровнен
- При переключении в OCP сбрасывается «Запомнить пароль»; добавлены регрессионные тесты

## Зачем
- На вкладке «Новый» / «Модуль OCP» после заполнения login/domain/API key показывался тост «Заполните обязательные поля» из‑за кросс-валидации с SIP-only (Remember password / пустые SIP-поля)

## Результат
- `npm run test` — 2176 passed / 1 skipped
- `npm run lint` + `npm run typecheck` — green
- Следующий шаг: `/preflight` → `/review` (WU-06) или ручная проверка OCP sign-in

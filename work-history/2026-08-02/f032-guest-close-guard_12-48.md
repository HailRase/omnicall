# F-032 guest close-guard для окон карточек

**Дата:** 2026-08-02 12:57
**Статус:** выполнено
**Коммит:** —

## Где
- `src/preload/externalApplicationGuest.ts`
- `src/main/externalApplications/` (interceptor, query, IPC registration)
- `src/shared/ipc/ExternalApplicationCloseGuardContract.ts`
- `src/shared/ipc/ExternalApplicationGuestApi.ts`
- `electron.vite.config.ts`
- `docs/softphone/adr/ADR-0024-external-applications-screen-pop-windows.md`
- `docs/softphone/P14-External-Applications-Design.md`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `CHANGELOG.md`

## Что
- Добавлен минимальный guest preload с API `window.omnicall.setCloseGuard`
- Ключ API: `omnicall` (не `omnicallExternalApplication`)
- Native Close перехватывается в main; явный `true` закрывает окно, иначе блокирует
- Без guard поведение как раньше (unrestricted close)
- Force-close на call-ended `close` и dispose без guard
- Unit-тесты contract/interceptor/query; обновлены ADR/P14/Registry/STATUS/CHANGELOG

## Зачем
- Дать любой карточке повесить колбэк на крестик и самой решать, можно ли закрыть окно, без знания softphone о полях карточки.

## Результат
- `vitest` close-guard + F-032 related: PASS
- `npm run typecheck`: PASS
- eslint touched files: PASS
- `npm run registry:check`: 86/0 PASS
- `npx electron-vite build`: PASS (`out/preload/externalApplicationGuest.js`)
- API surface для карточек: `window.omnicall.setCloseGuard` / `clearCloseGuard`

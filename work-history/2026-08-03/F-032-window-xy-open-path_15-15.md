# F-032 Window Geometry Domain + Open Path (x/y)

**Дата:** 2026-08-03 15:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-applications/`
- `src/shared/ipc/OpenExternalApplicationWindowContract.ts`
- `src/ports/integration/ExternalApplicationWindowGateway.ts`
- `src/application/services/integration/external-applications/executeExternalApplicationJob.ts`
- `src/main/externalApplications/`
- `docs/softphone/Feature-Registry.md`, `P14-External-Applications-Design.md`, `adr/ADR-0024-…`

## Что
- Расширен `ExternalApplicationWindowSize` полями `x`/`y` + константы defaults/clamps (`[-10000,10000]`, default `100,100`)
- Parse: missing x/y → defaults (без schema bump); invalid → error + fallback
- IPC/port payload требует integer x/y; application передаёт координаты в `openWindow`
- Main создаёт `BrowserWindow` с x/y и clamp к nearest display workArea; existing window — focus only
- Обновлены фикстуры/тесты и docs (F-032 AC + evidence, P14, ADR-0024)

## Зачем
- Сохранённая позиция окна External Applications должна открывать реальный BrowserWindow в этих координатах; контракты готовы для UI-агентов геометрии.

## Результат
- Targeted tests green: parse, IPC contract, clamp, automation, migrate, match, panel (55 tests)
- Schema bump не потребовался
- UI preview/presets — вне scope (Agents 2–3)

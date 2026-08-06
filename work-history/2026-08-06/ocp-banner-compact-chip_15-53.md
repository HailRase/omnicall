# OCP connection banner compact chip

**Дата:** 2026-08-06 15:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/integration/ocp/OcpConnectionBanner.*`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`
- `docs/softphone/UI-Design-System.md`, `UX-UI-Design-Blueprint.md`, `UI-Architecture.md`, `STATUS.md`, `Feature-Registry.md`, `Legacy-Feature-Coverage.md`, `adr/ADR-0026-feedback-channel-law.md`
- `CHANGELOG.md`

## Что
- Компактный one-line chip `OCP · status` вместо двухстрочного Alert
- Геометрия top-center как у IncomingCallOverlay (viewport edge, без titlebar safe-inset clip)
- Failed Retry: full-width `outline` + danger tokens (не `primary`)
- Та же edge-геометрия для UpdateAvailableBanner; канон в UI-Design-System
- Тесты `OcpStatusChrome` / `UpdateAvailableBanner` обновлены

## Зачем
- Баннер не влазил на compact main display (~360px) и кнопка Retry ломала dark theme

## Результат
- Канал ADR-0026 сохранён (shell banner, не Sonner)
- `vitest` OcpStatusChrome + UpdateAvailableBanner: PASS
- `npm run lint:css`: PASS

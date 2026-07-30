# OCP connection banner global overlay

**Дата:** 2026-07-30 23:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/components/integration/ocp/OcpConnectionBanner.module.css`
- `src/renderer/styles/tokens.css` (`--z-shell-status-banner`)
- docs: UX blueprint, UI-Design-System, Feature-Registry, ADR-AF-002

## Что
- Баннер перенесён из header в shell overlays (рядом с `OcpSignInProgress`)
- z-index `--z-shell-status-banner` (20): выше Settings, ниже Dialog/modals
- Тест и документация обновлены

## Зачем
- Баннер reconnect должен быть виден глобально: dialpad, контакты, история, видео, Настройки — как модалка этапов OCP

## Результат
- `OcpStatusChrome.test.tsx` PASS

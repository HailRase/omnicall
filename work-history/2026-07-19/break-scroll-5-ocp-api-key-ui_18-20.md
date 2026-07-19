# Перерывы ×5 + убрать API key из OCP Module

**Дата:** 2026-07-19 18:20
**Статус:** выполнено
**Коммит:** `4551f39`

## Где
- `src/renderer/components/integration/ocp/OcpStatusDropdown.*`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.*`
- `src/renderer/hooks/useOcpSettingsPanel.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/Feature-Registry.md`

## Что
- В дропдауне статусов видно максимум 5 перерывов, дальше скролл
- Из Integrations → OCP Module убраны поле/сохранение/удаление `Ocp-Proxy-Api-Key`
- Хук `useOcpSettingsPanel` больше не читает/пишет API key через Facade

## Зачем
- Компактнее список перерывов; API key приходит при авторизации, не редактируется в интеграциях

## Результат
- Focused tests + typecheck green

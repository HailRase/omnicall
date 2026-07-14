# F-028 OCP UI polish

**Дата:** 2026-07-14 16:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/widgets/OperatorStatusSelector/`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.*`
- `src/renderer/components/integration/ocp/OcpStatusTimer.tsx`
- `src/renderer/hooks/useCallDuration.ts`
- `src/renderer/shells/SoftphoneShellHeader.*`
- `src/renderer/components/integration/ocp/OcpLogoutReasonModal.module.css`
- `src/renderer/components/shell/ShellDialpadPanel.module.css`
- `src/renderer/components/settings/settingsSections.ts`
- `src/renderer/components/settings/SettingsSidebar.*`
- `src/renderer/components/icons/iconCatalog.ts`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`

## Что
- Селектор статуса: pill-форма, выше (`min-height` + padding), на всю ширину слота в хедере, ellipsis + title, полупрозрачный таймер
- Таймер статуса: всегда `00:00:00` (`hh:mm:ss`) через `useCallDuration(..., "hh:mm:ss")`
- Dropdown: группы «Готов» / «Перерыв» как uppercase subtitle
- Модалка логаута: кнопки справа в footer
- Settings: «Интеграции» parent → «OCP Module» child

## Зачем
- Полировка UX F-028: читаемость статуса в хедере, иерархия меню и навигации интеграций

## Результат
- Фокус-тесты OperatorStatusSelector / OcpStatusChrome / SoftphoneShellHeader — green
- Ранее: full suite 2025 passed + typecheck/lint/i18n/catalog green

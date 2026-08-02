# Убран раздел уведомлений из «Общие»

**Дата:** 2026-08-02 19:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx`
- `src/renderer/components/settings/SettingsPanel.tsx`
- i18n (`messages.ts`, `bgMessages.ts`, `bg-strings.json`)
- тесты General/SettingsPanel; `UI-Component-Catalog.md`; `I18N-Coverage.md`

## Что
- Удалён fieldset «Уведомления» и CTA «Открыть внешний вид» из Общих
- Убран prop `onOpenNotificationAppearance` и навигационный handler в SettingsPanel
- Удалены неиспользуемые i18n-ключи relocated/openAppearance/legend
- Appearance остаётся только в Settings → Уведомления

## Зачем
- Избежать дублирования и путаницы: уведомления — отдельный раздел

## Результат
- `vitest` SettingsGeneralPanel + SettingsPanel — OK (12)
- `npm run ui:catalog` — OK

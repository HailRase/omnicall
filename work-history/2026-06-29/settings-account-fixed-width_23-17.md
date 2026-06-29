# Форма аккаунта — откат и фиксированная ширина

**Дата:** 2026-06-29 23:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx` — откат к HEAD
- `src/renderer/components/account/AccountPanel.module.css` — откат к HEAD
- `src/renderer/components/settings/SettingsPanel.tsx` — откат к HEAD
- `src/renderer/components/settings/SettingsPanel.module.css` — откат к HEAD
- `src/renderer/components/settings/panels/SettingsAccountPanel.module.css` — фикс. ширина 20rem

## Что
- Отменены все предыдущие доработки (centered layout, карточка, сетка 2×2, contentBodyFit)
- В настройках форма центрирована, ширина панели и инпутов **20rem**

## Зачем
Вернуть простую исходную форму; оставить только фиксированную ширину полей.

## Результат
- test / lint / typecheck — ok

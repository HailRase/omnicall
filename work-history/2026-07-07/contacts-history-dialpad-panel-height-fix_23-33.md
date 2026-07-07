# Contacts/history dialpad panel height fix

**Дата:** 2026-07-07 23:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.tsx`
- `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.module.css`
- `src/renderer/components/shell/ShellDialpadPanel.module.css`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Добавлен слот `mainPanels` — якорь на всю `main` (context + controls), не только controls
- Панели перенесены из controls в `mainPanels`
- Задана явная высота: 72% main (sidebar) / 88% (fullPanel), min до 28rem/36rem
- Header и window controls по-прежнему не перекрываются

## Зачем
Панели схлопывались до ~100–150px, т.к. якорились к узкой controls-зоне без dialpad и без явной height.

## Результат
Focused tests OK; incoming call layering сохранён.

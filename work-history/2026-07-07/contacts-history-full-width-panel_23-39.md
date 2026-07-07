# Contacts/history full-width panel

**Дата:** 2026-07-07 23:39
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/ShellDialpadPanel.module.css`
- `src/renderer/components/shell/ShellDialpadPanel.tsx`

## Что
- Панель на всю ширину окна (`left: 0; right: 0; width: 100%`)
- Убраны узкие sidebar-ширины `22rem` / `28rem`
- Сохранены top-offset под window controls и slide-in слева

## Зачем
Пользовательский UX: overlay должен закрывать всю рабочую область, кроме titlebar controls.

## Результат
Focused tests passed.

# ControlsBar — визуальное разделение зон shell

**Дата:** 2026-06-29 22:28
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/styles/tokens.css`
- `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.module.css`
- `src/renderer/components/call/CallControlsBar.module.css`

## Что
- Токены shell: header/footer → surface, body → app (светлее панели, темнее середина)
- Зона controls: border-top + фон footer
- Откат инверсии «тёмные header/footer» по запросу пользователя

## Зачем
Визуально отделить header, body и footer без изменения логики вызовов.

## Результат
Токены возвращены к первоначальной схеме.

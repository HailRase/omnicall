# Polish: mode tabs borderless + API key eye row

**Дата:** 2026-07-17 15:04
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/tabs/Tabs.module.css`
- `src/renderer/components/ui/input-group/InputGroup.module.css`
- `docs/ui-kit/VISUAL-SPEC.md`

## Что
- Slide-tabs: idle/hover/active triggers без border; общий `--tabs-thumb-radius` для hover и selected thumb
- InputGroup: `flex-wrap: nowrap` по умолчанию (глазок API key на одной строке); wrap только для block-addon через `:has`

## Зачем
- Убрать топорный вид mode tabs и починить уезд visibility toggle на вторую строку.

## Результат
- Tabs + InputGroup tests — ok

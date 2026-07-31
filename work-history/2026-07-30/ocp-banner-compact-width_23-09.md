# OCP connection banner compact width

**Дата:** 2026-07-30 23:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/integration/ocp/OcpConnectionBanner.tsx`
- `src/renderer/components/integration/ocp/OcpConnectionBanner.module.css`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- Узкий layout под compact window: max ~16.5rem, overflow hidden, ellipsis
- Reconnecting — одна строка `OCP · Переподключение N/M`
- Короче copy во всех локалях; меньший padding/иконка

## Зачем
- На main display текст переносился и вылезал за границы баннера

## Результат
- `OcpStatusChrome.test.tsx` PASS

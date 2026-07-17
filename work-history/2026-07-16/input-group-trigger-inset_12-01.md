# InputGroup trigger inset

**Дата:** 2026-07-16 12:01
**Статус:** выполнено
**Коммит:** `4461bfa`

## Где
- `src/renderer/components/ui/input-group/InputGroup.module.css`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.module.css`

## Что
- Добавил единый vertical inset для `InputGroupAddon` с `align="inline-start|inline-end"`
- Уменьшил визуальный размер clear-кнопки и dropdown trigger внутри OCP login field
- Оформил trigger как явную раскрывающую кнопку: outline surface + chevron
- Добавил анимацию поворота chevron в открытом состоянии
- Проверил совместимость через targeted tests, lint и typecheck

## Зачем
- Dropdown trigger не должен касаться верхнего и нижнего края input-group.
- Пользователь должен сразу понимать, что элемент «Выбрать» открывает выпадающее меню.

## Результат
- `npm run test -- src/renderer/components/ui/input-group/InputGroup.test.tsx src/renderer/components/settings/panels/SettingsIntegrationsPanel.test.tsx` — ok
- `npm run lint` — ok
- `npm run typecheck` — ok

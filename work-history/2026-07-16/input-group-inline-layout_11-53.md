# InputGroup inline layout

**Дата:** 2026-07-16 11:53
**Статус:** выполнено
**Коммит:** `4461bfa`

## Где
- `src/renderer/components/ui/input-group/InputGroup.module.css`

## Что
- Убрал `width: 100%` у `.control` в `InputGroup`
- Оставил `flex`-поведение, чтобы input занимал доступное место, но не выталкивал addons на новую строку
- Сохранил совместимость с текущим OCP login picker и тестами UI Kit

## Зачем
- Элементы внутри `InputGroup` должны располагаться в строку для сценариев с input и actions справа.

## Результат
- `npm run test -- src/renderer/components/ui/input-group/InputGroup.test.tsx src/renderer/components/settings/panels/SettingsIntegrationsPanel.test.tsx` — ok
- `ReadLints` для `InputGroup.module.css` — ошибок нет

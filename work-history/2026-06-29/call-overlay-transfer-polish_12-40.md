# Call overlay padding, hold/resume, transfer UI

**Дата:** 2026-06-29 12:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallControlsBar.tsx` + `.module.css`
- `src/renderer/components/call/TransferPanel.tsx` + `.module.css`
- `src/renderer/components/dialpad/Dialpad.module.css`
- `src/renderer/hooks/useTransferActions.ts`
- тесты и Storybook TransferPanel / CallControlsBar

## Что
- Удержание на hold: иконка `call.resume` (play), зелёный `buttonResume` через токены light/dark
- TransferPanel: зоны header / body / footer с собственным padding по образцу TransferFlow
- Шаги перевода: ввод номера → карточки типа → консультация → футер «Отмена» / «Завершить перевод»
- Сброс `targetNumber` при входе и выходе из transfer mode в `useTransferPanelShell`
- Dialpad overlay: padding у header, keys и call-кнопки
- Тест held/resume; catalog обновлён (`transfer-footer-cancel`)

## Зачем
Гармоничный overlay UI, корректные состояния кнопок в обеих темах, UX перевода как в design-reference без сохранения номера между сессиями.

## Результат
`npm run test` — 782 passed, 1 skipped; `lint` + `typecheck` + `ui:catalog` — OK

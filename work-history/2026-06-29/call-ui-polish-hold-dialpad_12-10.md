# Call UI polish: hold dialpad, state controls, layout

**Дата:** 2026-06-29 12:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/components/call/CallControlsBar.tsx`
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/shells/call/CallControlsShell.tsx`, `CallContextShell.tsx`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/components/call/TransferPanel.tsx`
- `.cursor/rules/ux-ui-electron-react.mdc`

## Что
- Удалён `AvatarRecoveryRing`; перерегистрация SIP через `control-reregister-sip` в header
- Кнопки звонка показывают состояние (микрофон выкл. — красный MicOff; удержание — pause)
- Hangup: белая иконка на красном фоне
- Dialpad: `<input type="tel">`; скрыт при удержании; overlay «Набор номера» с крестиком
- TransferPanel: подписи к кнопкам действий
- Root shell без скролла; padding по зонам layout; правило в ux-ui-electron-react

## Зачем
Улучшить читаемость и UX активного звонка, набора номера при удержании и recovery без кольца на аватаре.

## Результат
`npm run test` — 777 passed, 1 skipped; `npm run lint`, `npm run typecheck`, `npm run ui:catalog` — OK

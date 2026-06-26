# Remove shell collapse + always-visible UI

**Дата:** 2026-06-26 17:26
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useShellCollapse.ts` (удалён)
- `src/renderer/shells/SoftphoneReadyShell.tsx`, `SoftphoneShellHeader.tsx`
- `src/renderer/shells/call/CallContextShell.tsx`, `CallControlsShell.tsx`, `CallOverlayShell.tsx`
- `src/renderer/widgets/SoftphoneLayout/`
- `docs/softphone/UX-UI-Design-Blueprint.md`, `Feature-Registry.md`, `Icon-Registry.md`

## Что
- Удалена логика collapsed: хук, toggle в header, props в layout/shells, тесты и Storybook
- Убраны иконки `shell.collapse` / `shell.expand`
- Call UI всегда видим: сняты `return null` по `sipRegistered` в context/controls/overlays
- Кнопка «Позвонить» disabled через `callDisabledReason` («Не зарегистрирован») до SIP registration

## Зачем
Софтфон всегда развёрнут; оператор видит интерфейс до авторизации, но не может звонить без регистрации.

## Результат
- `npm run test`: 780 passed, 1 skipped
- lint, typecheck, ui:catalog: green

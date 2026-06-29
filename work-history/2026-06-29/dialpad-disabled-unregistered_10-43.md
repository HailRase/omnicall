# Блокировка UI при отсутствии SIP-регистрации

**Дата:** 2026-06-29 10:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveAuthShellFlags.ts`
- `src/renderer/hooks/useDialpadShell.ts`
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/components/call/CallControlsBar.tsx`
- `src/renderer/hooks/useIncomingCallActions.ts`
- `src/renderer/shells/call/CallControlsShell.tsx`

## Что
- Добавлен флаг `isSipRegistered` в `deriveAuthShellFlags`
- Dialpad: блокировка клавиш, удаления и клавиатурного ввода при `!isSipRegistered`
- CallControlsBar: mute/hold/transfer/DTMF блокируются; hangup остаётся доступным
- Входящий звонок: ответ заблокирован с причиной «Не зарегистрирован»
- Тесты Dialpad и deriveAuthShellFlags обновлены

## Зачем
Пользователь не должен взаимодействовать с dialpad и элементами управления софтфоном до успешной SIP-регистрации.

## Результат
`npm run test` — 784 passed, 1 skipped; `npm run lint` и `npm run typecheck` — OK.

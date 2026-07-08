# Contacts/History Phase 4 — Active Call Identity Enrichment

**Дата:** 2026-07-08 12:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/read-models/contactDirectory.ts`
- `src/application/projections/telephony/deriveIncomingCallIdentityShell.ts`
- `src/application/projections/telephony/deriveCallLinesShell.ts`
- `src/application/projections/telephony/deriveIncomingCallControlLine.ts`
- `src/application/projections/telephony/deriveCallControlTarget.ts`
- `src/renderer/hooks/useCallLineRowShell.ts`, `useIncomingCallShell.ts`, `useCallFeatureShell.ts`
- `src/renderer/shells/call/CallContextShell.tsx`
- `src/renderer/components/call/IncomingCallSessionCard.tsx`, `OutgoingCallCard.tsx`

## Что
- Добавлен `deriveIncomingCallIdentityShell` и `resolveCallLineDisplayName` на базе `contactDirectory`.
- `deriveCallLinesShell` обогащает `displayName` активных линий по контактам.
- `deriveIncomingCallControlLine` и `deriveCallControlTarget` принимают contacts и используют единый read model.
- Shell hooks передают `contactsProjection.contacts` в derive-функции.
- Incoming session card и outgoing pre-connect card показывают contact-first имя с номером как secondary.
- Unit-тесты для call lines, incoming identity/control line, call control target.

## Зачем
Фаза 4 плана: единое отображение имени абонента в активных линиях, входящих карточках и исходящем дозвоне без мутации SIP/Domain и без matching в React.

## Результат
- `vitest` focused: 20 application + 6 renderer tests — PASS
- `tsc --noEmit` — PASS
- Следующий шаг: Phase 5 — iPhone-like History Detail UI

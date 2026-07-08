# Incoming overlay visibility derive fix

**Дата:** 2026-07-08 20:39
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/telephony/deriveIncomingCallSessionCardVisible.ts`
- `src/application/projections/telephony/deriveIncomingCallGlobalOverlayVisible.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/hooks/useIncomingCallOverlayShell.ts`
- `src/renderer/shells/call/CallContextShell.tsx`
- `docs/softphone/Feature-Registry.md`

## Что
- Единый derive для видимости `IncomingCallSessionCard` (DTMF, transfer, number entry, celebration)
- Глобальный overlay скрыт на dialpad только когда inline-карточка реально видна
- На dialpad в DTMF/transfer/number-entry overlay снова показывается
- На history/settings/contacts overlay всегда при ringing

## Зачем
Скрытие по `route === dialpad` ломало входящий UX в call UI modes, где context card не рендерится.

## Результат
- 14 tests passed (derive + shell hook)
- eslint: passed

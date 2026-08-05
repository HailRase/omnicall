# P0 First-run CTA + Account empty-state

**Дата:** 2026-08-05 15:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallIdleEmptyState.tsx` (+ module CSS)
- `src/renderer/shells/call/CallContextShell.tsx`, `SoftphoneReadyShell.tsx`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `docs/softphone/P11-First-Run-Sign-In-CTA.md`, `Feature-Registry.md`

## Что
- CTA «Войти в аккаунт» только в idle-зоне
- Убрана дублирующая кнопка на Dialpad
- Dark/light: CTA на `Button` `secondary` (surface tokens), без filled accent / focus cyan
- First-run hint в Account при пустых профилях

## Зачем
- Первая миля + корректный вид CTA в тёмной теме

## Результат
- vitest CallIdleEmptyState — green
- Version bump не делался

# Компактный баннер обновления (F-020)

**Дата:** 2026-07-06 09:30
**Статус:** выполнено
**Коммит:** `e6a7c31`

## Где
- `src/renderer/components/updates/UpdateAvailableBanner.tsx`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/i18n/messages.ts`

## Что
- Modal overlay заменён компактной полосой в header
- Только кнопки «Скачать» и «Позже», без крестика и release notes
- Короткий текст уведомления (ru/en/fr/de)

## Зачем
Ненавязчивое UX-уведомление об обновлении без перекрытия интерфейса.

## Результат
- release:preflight green; shipped as v0.3.1

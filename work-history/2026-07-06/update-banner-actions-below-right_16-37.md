# Баннер обновления — actions под текстом справа

**Дата:** 2026-07-06 16:37
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/updates/UpdateAvailableBanner.tsx`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`
- `src/renderer/components/icons/iconCatalog.ts`

## Что
- Layout: текст сверху, кнопки отдельной строкой справа (`justify-content: flex-end`)
- Кнопки с `AppIcon`: Download + `updates.available`, Later + `overlay.close`
- Иконка баннера в accent-badge; стили кнопок с transitions как в SettingsForm

## Зачем
Уточнение UX: кнопки не на одной линии с текстом, а под ним справа; современный вид с иконками каталога.

## Результат
- test/lint/typecheck — OK

# SDK AlertDialog buttons parity

**Дата:** 2026-07-21 22:39
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SdkModuleSettingsOriginConfirmDialog.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsPairedSection.tsx`
- `docs/softphone/Feature-Registry.md` (F-011)

## Что
- Модалка «Удалить сайт?» / blacklist: `AlertDialogCancel`/`Action` через `asChild` + UI Kit `Button` (`ghost` / `destructive`)
- То же для revoke paired-client confirm
- Cancel в delete-site использует `common.cancel`

## Зачем
Кнопки в destructive confirm выглядели как нативный chrome, не как остальные AlertDialog в приложении.

## Результат
- `SdkModuleSettingsCard.test.tsx` — PASS (7)

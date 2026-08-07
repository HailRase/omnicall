# Синхронизация omnicall-kit на GitHub

**Дата:** 2026-08-06 23:01
**Статус:** выполнено
**Коммит:** `3d095e3` (HailRase/omnicall-kit)

## Где
- инкубация: `omnicall-kit/` в softphone-electron
- remote: https://github.com/HailRase/omnicall-kit

## Что
- склонирован private repo HailRase/omnicall-kit
- зеркально перенесена текущая инкубационная копия (без node_modules/dist)
- закоммичен sync до kit `0.2.1` / protocol `0.1.0`
- выполнен `git push origin main`

## Зачем
- обновить standalone publishable source после релизов 0.2.x в softphone

## Результат
- remote tip: `3d095e3` = `origin/main`
- URL: https://github.com/HailRase/omnicall-kit/commit/3d095e32b496dce21b9dbc409c5d35a8db05240a
- softphone-electron не коммитился (изменений kit в нём не было)

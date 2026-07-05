# CI Release: Pillow для build:icons

**Дата:** 2026-07-05 13:10
**Статус:** выполнено
**Коммит:** `2fe0749`

## Где
- `.github/workflows/release.yml`
- `scripts/requirements-build.txt`

## Что
- Добавлен `setup-python` + `pip install -r scripts/requirements-build.txt` перед сборкой
- Зафиксирована зависимость `Pillow` для `scripts/build-app-icons.py`
- Тег `v0.1.0` пересоздан на main с fix для повторного Release workflow

## Зачем
Release #24 падал на всех OS: `ModuleNotFoundError: No module named 'PIL'`.

## Результат
- `npm run build:icons` локально — PASS после `pip install -r scripts/requirements-build.txt`
- Push main + tag `v0.1.0` — CI Release должен перезапуститься

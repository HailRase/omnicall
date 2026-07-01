# release.yml YAML colon syntax fix

**Дата:** 2026-07-01 18:10
**Статус:** выполнено
**Коммит:** `eed3251`

## Где
- `.github/workflows/release.yml`

## Что
- `DIST_COMMIT_MSG: chore(release): ...` — двоеточие ломало YAML (0 jobs Failure)
- Закавычено значение; body через `>-`
- Тег v0.0.2 → eed3251

## Зачем
Runs #18–20: мгновенный Failure, имя `.github/workflows/release.yml`.

## Результат
Ожидать Release run с именем **Release** и jobs build/publish.

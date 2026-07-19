# Commit, merge branches, release v0.11.2

**Дата:** 2026-07-19 22:15
**Статус:** выполнено
**Коммит:** `16f1a15` (main / ocp-integration / feature/real-adapters); video-refactorin merge tip `d6c7dc3`

## Где
- ветки: `ocp-integration`, `main`, `feature/real-adapters`, `video-refactorin`
- tag `v0.11.2`
- `package.json` / `distribution/update-manifest.json` → `0.11.2`

## Что
- Закоммичен и запушен fix OCP modal Disconnect + scoped reconnect (`64eec42`).
- `ocp-integration` вмержен в `main`, `feature/real-adapters`, `video-refactorin`.
- Release cut `0.11.2` на `main` (preflight OK, changelog, sync-manifest, tag push).
- Release-коммиты пропагированы обратно во все перечисленные ветки.

## Зачем
- Синхронизировать рабочие ветки и выпустить актуальную дистрибуцию.

## Результат
- Все ветки на версии `0.11.2` с актуальным manifest.
- CI Release для `v0.11.2` запущен после push tag.

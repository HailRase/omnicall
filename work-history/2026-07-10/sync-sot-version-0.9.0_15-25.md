# Sync SoT version to 0.9.0

**Дата:** 2026-07-10 15:25
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json`, `package-lock.json`
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json`, `docs/softphone/release/update-manifest.json`, `docs/softphone/examples/update-manifest.json`
- `docs/softphone/STATUS.md`

## Что
- Выровнял локальный SoT с уже опубликованным `v0.9.0` на `main` / axatalk-releases
- Восстановил манифесты и `distribution/CHANGELOG.md` из cut `20a8f21`
- В `CHANGELOG.md` добавил секцию `[0.9.0]`, сохранил Unreleased (ADR-0005)
- STATUS Release train: Shipped 0.9.0, Next 0.9.1 / 0.10.0

## Зачем
- Ветка `feature/real-adapters` отставала от release cut; локально было 0.8.0 при public 0.9.0

## Результат
- Локальный `package.json` = **0.9.0**, манифесты совпадают с axatalk-releases
- Новый release cut / tag не создавался (уже есть на origin)
- Headset и прочие незакоммиченные изменения не трогались

# Merge video integration в real adapters

**Дата:** 2026-07-12 13:07
**Статус:** выполнено
**Коммит:** `a93904d`

## Где
- `src/domain/media/`, `src/application/projections/media/`, `src/adapters/media/`
- `src/renderer/components/call/`, `src/renderer/components/dialpad/`, `src/renderer/hooks/`
- `src/shared/ipc/`, `src/main/media/`, `src/preload/index.ts`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/STATUS.md`, `docs/softphone/TASK-QUEUE.md`

## Что
- Влит `video-integration` в актуальную ветку `feature/real-adapters`.
- Разрешены конфликты без отката headset-интеграции: сохранены preferred headset id, headset sync busy и vendor/capability изменения.
- Сохранены video calls, screen share, fullscreen video, incoming answer with video и Settings Video.
- Совмещены dialpad history recall и video call кнопка без регрессии поведения пустого ввода.
- Объединены IPC/preload каналы для headset preferred device и display capture.
- Объединены i18n и документация registry/status/task queue.

## Зачем
- Перенести всю работу video-ветки в текущую ветку real adapters без downgrade UI и функциональности headset-интеграции.

## Результат
- Merge-коммит создан: `a93904d`.
- Проверки: `git diff --check` — пройдено; targeted `vitest` — 70 passed; `npm run typecheck` — пройдено; `npm run i18n:check` — пройдено; `npm run test` — 1844 passed, 1 skipped.

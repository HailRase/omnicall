# Local account profiles — discovery (Step 1)

**Дата:** 2026-07-06 00:32
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P11-Local-Account-Profiles-Design.md`
- `docs/softphone/Feature-Registry.md` (F-023)
- `docs/softphone/Legacy-Feature-Coverage.md` (LF-077)
- `docs/softphone/P11-Settings-Schema-Design.md`
- `docs/softphone/TASK-QUEUE.md` (T-011)

## Что
- Проведён аудит текущей реализации: `SettingsAccountKey` (username-only), stub `FileSettingsRepository`, `InMemorySettingsRepository` в real bootstrap, отсутствие profile switch при authorize.
- Добавлена фича **F-023** в Feature Registry (planned).
- Создан design doc с ключом профиля, layout на диске, port extensions, migration, 10-step plan.
- Обновлены LF-077, P11-Settings-Schema-Design (account key + v3), TASK-QUEUE T-011.

## Зачем
Подготовить architecture-compliant реализацию локальных профилей с per-account settings без регрессии SIP-only flows.

## Результат
- Discovery завершён; production-код не менялся.
- `npm run registry:check` — OK (22 paths).
- Следующий шаг: Domain model (Step 2) — composite profile key + tests.

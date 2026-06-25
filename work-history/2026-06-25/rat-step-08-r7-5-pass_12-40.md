# RAT Step 08 — R7-5 Smoke PASS

**Дата:** 2026-06-25 12:40
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/real-integration/PROGRESS.md`
- `docs/softphone/real-integration/SMOKE-CHECKLIST.md` § R7
- `docs/softphone/Legacy-Feature-Coverage.md` (LF-032)

## Что
- R7-5 PASS: active call + `multiSessionsEnabled=false` → second incoming auto-486
- Smoke method: временная правка default в `InMemorySettingsRepository` (откат на `true`)
- Документация R7-1…R7-5 полностью PASS

## Зачем
Закрыть полную матрицу R7 после manual smoke на dev SBC.

## Результат
- R7 gate **fully closed**
- Follow-up: P11 UI для переключения `multiSessionsEnabled` без правки кода

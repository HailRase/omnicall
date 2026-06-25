# RAT Step 08 — R7 Manual Smoke Gate Closed

**Дата:** 2026-06-25 12:35
**Статус:** выполнено (min gate)
**Коммит:** —

## Где
- `docs/softphone/real-integration/PROGRESS.md`
- `docs/softphone/real-integration/SMOKE-CHECKLIST.md` § R7
- `docs/softphone/Feature-Registry.md` (F-004)
- `docs/softphone/Legacy-Feature-Coverage.md` (LF-021, LF-023, LF-032)

## Что
- R7-1…R7-4: **PASS** на dev SBC (onedemoserver.online, `?adapters=real`, два extension)
- R7-5: **not verified** — нет UI для `multiSessionsEnabled=false` (`InMemorySettingsRepository` только read)
- PROGRESS step 08 → `done`; SMOKE § R7 обновлён

## Зачем
Закрыть RAT step 08 multi-call real после manual smoke minimum gate.

## Результат
- R7 gate **closed** (R7-1…R7-3 minimum)
- R7-5 follow-up: P11 settings или dev hook для smoke
- Следующий трек: F-008 DTMF real / P10 headset / merge branch

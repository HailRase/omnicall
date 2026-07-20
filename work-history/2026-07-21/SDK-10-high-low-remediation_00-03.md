# SDK-10 High/Low remediation + gate close

**Дата:** 2026-07-21 00:03
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/.changeset/` (`pre.json`, README, first-public-rc)
- `axatalk-sdk/docs/guide/release-and-support.md`, `DEPENDENCIES.md`, `WORK-UNITS.md`, `README.md`
- `axatalk-sdk/evidence/SDK-10-release-candidate.md`
- `axatalk-sdk-integration/evidence/DI-10-blocker-sdk-prereqs.md`, `WORK-UNITS.md`, `00-SNAPSHOT.md`, `README.md`
- `docs/softphone/Feature-Registry.md`

## Что
- High: `changeset pre enter rc` — подтверждён bump plan `0.1.0-rc.0` (не bare `0.1.0`)
- Документы RC workflow обновлены (pre mode + private:false перед version)
- Lows: README SDK-10 `done`, DI-10 blocker evidence актуализирован, clean-install перепроверен
- SDK-10 закрыт Mode A; F-011 остаётся `in progress`

## Зачем
- Закрыть findings `/sdk-review` SDK-10 и зафиксировать RC-ready / stable-blocked без ложного stable

## Результат
- wipe + `npm ci` + `preflight` + `release:check` + `docs:check` PASS
- changeset status (после temporary private:false): protocol/sdk → `0.1.0-rc.0`
- Следующий шаг трека: `/sdk-integration` DI-10 only

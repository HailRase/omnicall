# Commit and push activate consent attentionId

**Дата:** 2026-07-22 17:29
**Статус:** выполнено
**Коммит:** `affca32`

## Где
- `src/application/integration/DeferredSdkActivateConsent.ts`
- `src/renderer/hooks/useShellWindowAttentionFromSdk.ts`
- `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`
- `CHANGELOG.md`, Feature Registry, UX blueprint, tests, work-history

## Что
- Закоммичены все локальные изменения по dedupe raise activate consent через `attentionId`
- Пуш в `origin/feature/axatalk-sdk`
- Ветка синхронизирована с remote, working tree clean

## Зачем
- Опубликовать фикс повторного подъёма окна после Cancel и очистить локальную ветку

## Результат
- Коммит: `affca32` — `fix(sdk): dedupe activate consent window raise by attentionId`
- `git push` успешен; `git status` — clean, up to date with origin

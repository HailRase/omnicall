# Activate consent attentionId raise

**Дата:** 2026-07-22 17:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/DeferredSdkActivateConsent.ts` (+ test)
- `src/renderer/hooks/useShellWindowAttentionFromSdk.ts` (+ test)
- Docs: ADR-0013, UX Blueprint, Feature-Registry, CHANGELOG

## Что
- `attentionId` на каждый эпизод activate consent
- Shell raise dedupeKey = `attentionId` (не origin:profile)
- Повторный consent после Cancel снова поднимает окно

## Зачем
- Main FIFO dedupe блокировал повторный raise для того же origin+profile.

## Результат
- Tests: DeferredSdkActivateConsent, useShellWindowAttentionFromSdk, consent modal — green

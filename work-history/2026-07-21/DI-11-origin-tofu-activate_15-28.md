# DI-11 Origin TOFU / Blacklist / Activate Consent

**Дата:** 2026-07-21 15:28
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/SdkOriginTrust.ts`, `SdkIntegrationSettings.ts`, `sdkOriginTrustMutations.ts` (schema v11)
- `src/adapters/integration/*` — upgrade TOFU/blacklist/CORS, matrix ∩ grants, activate matrix gate
- `src/main/sdk/*` — always-on gateway, Settings IPC origin ops
- `src/application/integration/*` — activate consent + pending guard
- `src/renderer` — AF-004 `integrations-sdk`, Settings IA, TOFU/activate modals, i18n
- `axatalk-sdk` — `origin_blocked` mapping
- `axatalk-sdk-integration/evidence/DI-11-origin-tofu-blacklist-activate.md`

## Что
- Origin trust `unknown|allowed|denied` + Unblock restore + per-Origin capability matrix
- Always-on loopback (Settings enable toggle removed; `AXATALK_SDK_GATEWAY=0` kill-switch)
- Renderer TOFU modal; blacklist → client `origin_blocked`; first Deny → `forbidden`+`origin_denied`
- Pre-auth Settings → Axatalk SDK; OCP Module остаётся gated
- Activate consent every login when matrix on; pending → `conflict`+`activate_consent_pending`
- Тесты focused 60 PASS; typecheck/i18n/api:check PASS

## Зачем
Реализовать ADR-0018 на desktop gateway + Settings без закрытия F-011/P12 и без SemVer bump.

## Результат
DI-11 → `review`. Запрошен `/sdk-review` DI-11 only. F-011 `in progress`, P12 open, версия `0.11.2`.

# P01 Authorization And Account Bootstrap

**Дата:** 2026-06-23 16:10  
**Статус:** выполнено  
**Коммит:** —

## Где

- `src/domain/` — SipAccount, OperatorSession, RegistrationState, Domain Events
- `src/ports/` — OperatorPlatformGateway, TelephonyGateway, SettingsRepository
- `src/application/` — Use Cases, projection, AccountBootstrapFacade
- `src/adapters/mock/` — mock OCP и SIP gateways
- `src/renderer/` — Auth UI, AccountPanel, PhoneStatusBadge, Zustand projection
- `docs/softphone/Feature-Registry.md` — F-001, F-009

## Что

- Domain Events: OCP auth, SipCredentialsReceived, Registration*
- Use Cases: AuthenticateOcp, AuthorizeSipAccount, RegisterAccount
- Mock gateways (без JsSIP)
- UI states: loading, invalid token, session exists, access denied, register/fail
- Phone status Online/Offline/DND (LF-011)
- SIP-only и OCP bootstrap (`?mode=ocp&token=&domain=`)

## Зачем

P01 roadmap: optional OCP + SIP-only авторизация через Use Cases и event-derived projections.

## Результат

| Проверка | Итог |
|----------|------|
| `npm test` (26) | ✓ |
| `npm run typecheck` | ✓ |
| `npm run lint` | ✓ |
| `npm run build` | ✓ |
| Gate P01 (mock only) | ✓ |

Legacy: LF-001–LF-007, LF-011, LF-085.

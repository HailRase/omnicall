# OCP SESSION_EXIST message

**Дата:** 2026-07-19 20:04
**Статус:** выполнено
**Коммит:** `86bfb32`

## Где
- `deriveOcpSignInProgressView.ts`
- i18n `account.authProgress.failure.sessionExist` (ru/en/fr/de/bg)
- `OcpSignInProgress.tsx` (status label for non-timeout failures)

## Что
- `SESSION_EXIST` / invalid API key и SIP-ошибки показываются сразу (без ожидания таймаута бара)
- Текст: «Сессия уже существует. Закройте существующие сессии.»
- Сетевые обрывы по-прежнему ждут заполнения бара → timeout

## Зачем
- HTTP 200 + `SESSION_EXIST` — успешный ответ с бизнес-ошибкой, не таймаут сети.

## Результат
- derive + modal tests green

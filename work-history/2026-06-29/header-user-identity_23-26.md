# Header: имя пользователя и статус

**Дата:** 2026-06-29 23:26
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/accountBootstrapProjection.ts`
- `src/application/projections/deriveHeaderChromeShell.ts`
- `src/renderer/components/header/UserHeaderIdentity.tsx`
- `src/renderer/shells/SoftphoneShellHeader.tsx`

## Что
- В projection добавлен `sipUsername` (из `SipCredentialsReceived` / `RegistrationRequested`, сброс при logout)
- Справа от аватара: логин и статус «Онлайн» / «Оффлайн» / «Не беспокоить» с приглушёнными цветами токенов
- Инициалы аватара — первые две буквы SIP-логина после авторизации
- Компонент `UserHeaderIdentity`, тесты и обновление UI catalog

## Зачем
Показать в header компактную идентичность оператора: кто залогинен и текущий presence-статус, без перегруза интерфейса.

## Результат
`npm run test` — 831 passed; `npm run lint`, `npm run typecheck`, `npm run ui:catalog` — OK.

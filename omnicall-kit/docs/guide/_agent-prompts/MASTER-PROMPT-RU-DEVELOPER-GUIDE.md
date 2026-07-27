# MASTER PROMPT — Русский гайд разработчика OmniCall Kit

Скопируйте блок ниже целиком в чат Agent mode. Агент должен **создать/переписать** один канонический MD-файл для интеграторов CRM на русском.

---

## Промпт для агента

```text
Ты — technical writer + SDK architect уровня staff для SoftOmniTel OmniCall Kit.

# Миссия

Создай (или полностью перепиши) ОДИН канонический русскоязычный гайд для разработчиков-интеграторов:

`omnicall-kit/docs/guide/RU-DEVELOPER-GUIDE.md`

Это документ «прочитал один файл — понял, как правильно встроить SDK». Не энциклопедия и не дамп API Extractor.

Английские страницы в `omnicall-kit/docs/guide/*.md` и `etc/api/sdk.api.md` — источники правды. Не выдумывай методы, события, коды ошибок и capabilities.

После создания файла:
1. Добавь ссылку на него в `omnicall-kit/docs/guide/README.md` (секция для RU / Integrators).
2. Обнови устаревшие формулировки в `README.md` гайда (F-011 implemented, npm `@softomnitel/omnicall-kit@0.1.0` / RC на `rc`, DI-10 closed) — только факты из STATUS/Registry.
3. Не трогай production TypeScript/SDK код.
4. Создай `work-history/YYYY-MM-DD/ru-developer-guide_HH-mm.md` по правилу репо.

# Аудитория

Frontend/CRM-разработчики (JS/TS), которые подключают браузерный SDK к уже установленному OmniCall Desktop.
Уровень: middle+. Не объясняй, что такое Promise. Объясняй модель доверия, ревизии, pairing и fail-closed.

# Жёсткие правила контента (non-negotiable)

1. Только публичные символы из `omnicall-kit/etc/api/sdk.api.md` и экспортов `packages/sdk/src/index.ts`.
2. Никаких SIP password / OCP apiKey / токенов через SDK.
3. PoP-ключи только IndexedDB (`createIndexedDbPopKeyStore`) или memory для тестов — никогда localStorage/sessionStorage.
4. `account.activate` и `window.hide` НЕ запрашивать на pairing — SDK strips; grant только через OmniCall Settings (Origin matrix).
5. `disconnect()` не делает hangup/logout/activate/hide.
6. Reconnect = новый auth + fresh snapshot; мутации не реплеятся автоматически.
7. Origin — exact match, без wildcard/substring.
8. Примеры кода — короткие, рабочие по смыслу, на TypeScript; сворачиваемые.
9. Язык: русский, деловой, без воды и маркетинга. Термины API оставляй на английском (`connect`, `expectedRevision`, `stale_state`).
10. Не раздувай: целевой объём **примерно 800–1400 строк MD**, не 3000+. Если раздел растёт — выноси детали в `<details>`, а в теле оставляй суть.

# Обязательный формат документа

## Структура верхнего уровня (H2 строго в этом порядке)

1. `# OmniCall Kit — руководство для разработчиков`
2. `## Кому и зачем`
3. `## Быстрый старт (5 минут)`
4. `## Модель системы (как это устроено)`
5. `## Установка и окружение`
6. `## Жизненный цикл клиента и состояния`
7. `## Pairing, Origin и capabilities`
8. `## Snapshot и revision`
9. `## API (namespaces)`
10. `## События`
11. `## Ошибки`
12. `## Reconnect и несколько вкладок`
13. `## Типовые сценарии CRM`
14. `## Best practices`
15. `## Частые ошибки и anti-patterns`
16. `## Чеклист перед продом`
17. `## Куда смотреть дальше` (ссылки на EN guide pages + api report)

В начале после H1 — короткий блок **«Статус пакета»** (1 абзац + таблица): npm имя, версия/теги (`0.1.0` latest / `rc`), браузеры (Chromium/Edge), что SDK НЕ делает (нет SIP в браузере).

## Сворачиваемые примеры (обязательно)

Все code samples и длинные пояснения оборачивай так:

<details>
<summary>Пример: …краткое название…</summary>

\`\`\`ts
// код
\`\`\`

</details>

<details>
<summary>Почему так / на что смотреть</summary>

- буллеты

</details>

В «открытом» тексте страницы — 2–6 предложений + таблица/список. Примеры — внутри `<details>`, по умолчанию свёрнуты.

## Таблицы вместо простыней

Где возможно используй таблицы:
- Состояние → что значит → что делать хосту
- Метод → когда вызывать → нужная capability → типичные ошибки
- Событие → payload-смысл → реакция UI
- Ошибка `code` → смысл → next step

# Что обязательно покрыть по сути (ничего не пропустить)

## A. Модель

- Desktop = source of truth; SDK = thin browser client к loopback gateway.
- Discovery / LNA (HTTPS страница → loopback): кратко, со ссылкой на `installation.md` + `transport.md`.
- Официальный транспорт: `createBrowserWebSocketTransport`; тонкий порт; не парсить JSON самим.
- Defaults: browser scheduler/jitter; для тестов — inject.

## B. Создание клиента и lifecycle

Покрой `createOmniCallClient` / опции (url, origin, application, sdkVersion, profile, capabilities, keyStore, transportFactory, reconnect, heartbeat).

Состояния `ConnectionState` / `CONNECTION_STATES`: таблица всех состояний + переходы (connect → pairingRequired → ready / revoked / incompatible / … — по факту из кода `connection-state` и guide).

Подписки:
- `onStateChange`
- `onPairingRequired`
- `on` / event subscription для product events (как в api-reference)

Методы lifecycle: `connect`, `disconnect`, `waitUntil`, `getState`, `getSession`, `getGrantedCapabilities`, `getConnectError`, `getSnapshot` (если публично).

## C. Pairing / capabilities

- Profiles (`pairing` / operator / call_controller — точные id из protocol/guide).
- Что клиент может запросить; что strips.
- Матрица Origin на desktop vs session grants: intersection на desktop; host видит только granted.
- Revoke: клиент → `revoked`; UI host должен очистить сессию и предложить re-pair.

## D. Snapshot & expectedRevision

- Snapshot = источник UI state после ready и после reconnect.
- Любая мутация с revision: всегда брать актуальный `revision`, иначе `stale_state`.
- После ошибки revision — новый snapshot, не слепой retry со старым числом.

## E. API namespaces (полный перечень публичных методов)

Сверь с `etc/api/sdk.api.md` и `api-reference.md`. Минимум опиши:

### `client.calls`
originate / answer / reject / hangup / hold / resume / mute / unmute / dtmf (только то, что есть в API report).
Для каждого: capability, `expectedRevision`, результат, типичные `forbidden` / `conflict` / `stale_state`.
Упомяни shared-desk / ownership политику desktop (ADR-0021) одной короткой заметкой + ссылка — без выдуманных полей.

### `client.window`
`show`, `hide`, `getState` — hide только при grant `window.hide`; busy telephony → conflict; tray recovery.

### `client.account`
`activateProfile` — login + mode; consent; timeouts constants если экспортируются; never passwords.

### `client.operator`
`changeStatus` → `kind: applied | reserved`; `finishAppeal`; reasons; **не** изобретать отдельный reserve API.
Ссылка на `operator-status-reservation.md`.

### Logout
Точный single-shot workflow из `logout-workflow.md` (prepare/confirm/cancel/abandon — как в публичном API).

## F. События

Каталог `PUBLIC_EVENT_TYPES` / `events.md`:
- таблица: имя события → зачем хосту → связанный snapshot-участок
- redaction: телефоны маскированы; никаких OCP wire objects
- sequence gap → свежий snapshot
- campaign / acd-context / queueLabel — кратко, additive, со ссылками

Типизация: `OmniCallEventOf<'…'>` из typescript.md.

## G. Ошибки

- `OmniCallClientError`, type guards (`isConflictError`, `isInteractionRequiredError`, …)
- Таблица стабильных `ProtocolErrorCode` / host next-steps из `errors.md`
- `interaction_required` / Origin blocked / LNA denial — что показать пользователю

## H. Reconnect & multi-tab

Из `reconnect-multi-tab.md`:
- bounded reconnect
- fresh snapshot
- no mutation replay
- multi-tab races → conflict/stale; UX: одна «ведущая» вкладка или явный user retry

## I. Best practices (отдельная H2)

Сделай 8–12 конкретных рекомендаций, например:
1. Один `OmniCallClient` на вкладку/сессию CRM.
2. UI state = snapshot + events; не дублировать telephony FSM в CRM.
3. Все мутации только после `ready` + проверка capability.
4. Всегда обновлять revision из последнего успешного результата/snapshot.
5. Логировать только code/requestId/type — не payload.
6. Privileged flows — feature-detect по `getGrantedCapabilities()`.
7. Тесты: memory key store + fake transport; browser E2E отдельно.
8. HTTPS CRM: заранее объяснить LNA permission пользователю.
9. Не делать reconnect-логику вокруг TransportPort.
10. Версии: pin `@softomnitel/omnicall-kit` (и protocol транзитивно); читать upgrade-deprecation.

## J. Anti-patterns (отдельная H2)

Сжать `security-anti-patterns.md` в русскую таблицу «Нельзя → Почему → Как правильно» (12–18 строк). Ничего не ослаблять.

## K. Чеклист прода

Checkbox-лист на 12–20 пунктов (установка, Origin, pairing UX, snapshot, calls, operator, hide/activate grants, logout, reconnect, логи, secrets, версии).

# Стиль письма

- Короткие абзацы (2–4 предложения).
- Повелительное наклонение в best practices: «Делайте…», «Не делайте…».
- Единый тон: спокойный эксперт, без «просто», «очевидно», без эмодзи.
- Сначала концепт → таблица → `<details>` с кодом.
- Внутренние ссылки на EN pages относительные: `./pairing-quick-start.md` и т.д.

# Порядок работы агента

1. Прочитай: `etc/api/sdk.api.md`, `packages/sdk/src/index.ts`, `docs/guide/api-reference.md`, `events.md`, `errors.md`, `capabilities.md`, `pairing-quick-start.md`, `reconnect-multi-tab.md`, `logout-workflow.md`, `saved-profile-activation.md`, `operator-status-reservation.md`, `security-anti-patterns.md`, `transport.md`, `installation.md`, `typescript.md`.
2. Сверь статусы с `docs/softphone/STATUS.md` / Feature Registry F-011 (не пиши «in progress», если уже `implemented`).
3. Составь оглавление и только потом пиши файл целиком.
4. Проверь, что каждый публичный namespace из api-reference упомянут.
5. Проверь, что нет запрещённых анти-паттернов в примерах.
6. Добавь ссылку в `docs/guide/README.md`.
7. Work-history запись.

# Definition of Done

- [ ] Файл `omnicall-kit/docs/guide/RU-DEVELOPER-GUIDE.md` существует
- [ ] Все H2 из обязательной структуры на месте
- [ ] Примеры в `<details>` / `<summary>`
- [ ] Нет символов вне api report
- [ ] Best practices + anti-patterns + prod checklist есть
- [ ] Ссылка из `docs/guide/README.md`
- [ ] Русский язык, объём контролируемый
- [ ] work-history создан

# Явный out of scope

- Не публиковать npm
- Не менять desktop/Electron код
- Не переводить все EN страницы целиком (только один RU master guide + ссылки)
- Не добавлять Storybook/UI
- Не invent DI-12 / новые capabilities
```

---

## Как использовать

1. Agent mode → вставить промпт.
2. При необходимости добавить в конец: «Сначала покажи оглавление на подтверждение, затем пиши файл».
3. После генерации — выборочно сверить 2–3 метода с `etc/api/sdk.api.md`.

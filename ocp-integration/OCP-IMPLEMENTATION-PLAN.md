# OCP Integration Implementation Plan

**Feature:** F-028 — OCP Module Integration  
**Bounded context:** Integration (не Telephony)  
**Последнее обновление:** 2026-07-17
**Текущий статус:** 🟡 E-01…E-13 + Auth Flow Hardening implemented; staging SM-1…20 pending
**Версия схемы настроек:** v9 (`notificationPopupEnabled`)
**Команда для продолжения работы:** staging smoke checklist

### Delta 2026-07-17 — Auth Flow Hardening

- OCP sign-in exposes five timeout-owned execution stages and a fresh-flow restart.
- Socket epoch rejects stale messages from superseded connections.
- Account session, OCP authorization and SIP readiness are independent outcomes.
- Saved profile secrets use ADR-AF-006 local-form boundary hydration.
- Auth notifications pass through the F-029 rolling 24-hour journal.

### Delta 2026-07-16 — Simplify SIP/OCP authorization

| Item | Change |
| --- | --- |
| Orchestration | `OcpBackedSignInOrchestrationService`: HTTP→WS→creds→SIP register; one correlation ID; success only on `sip_ready` |
| Progress | `authorizationProgress` on `OcpSessionProjection` (preparing…ready / failures + retry) |
| Credentials | `OcpSipCredentialService.waitAndApplyNext` + identity mismatch when SIP already registered |
| INVALID_TOKEN | `OcpInvalidTokenReauthService` — one capped HTTP re-auth via Facade `connectOcp` (no stale-token WS reconnect) |
| Account UX | Two methods: account linking (default when linked) vs phone password; progress status |
| Integrations UX | Progressive first-time: login→domain→key→«Connect and sign in»; Enable/autoConnect after linked |
| Manual smoke | Still required: `OCP-Smoke-Checklist.md` — do not claim production readiness until checked |

---

## Быстрая навигация

| Этап | Название | Статус |
|------|----------|--------|
| [E-01](#e-01--domain-model--operator-bounded-context) | Domain Model — Operator Bounded Context | 🟢 |
| [E-02](#e-02--port-contract--ocp-protocol-types) | Port Contract + OCP Protocol Types | 🟢 |
| [E-03](#e-03--websocket-адаптер) | WebSocket Адаптер | 🟢 |
| [E-04](#e-04--application--use-cases) | Application — Use Cases | 🟢 |
| [E-05](#e-05--application--projections--bridge-services) | Application — Projections + Bridge Services | 🟢 |
| [E-06](#e-06--usersettings-v7--settings-ui-integrations) | UserSettings v7 + Settings UI (Integrations) | 🟢 |
| [E-07](#e-07--ui--operator-status-selector-в-хедере) | UI — Operator Status Selector в хедере | 🟢 |
| [E-08](#e-08--ui--модальное-окно-выхода-с-причиной) | UI — Модальное окно выхода с причиной | 🟢 |
| [E-09](#e-09--ui--кампании--ocp-уведомления) | UI — Кампании + OCP Уведомления | 🟢 |
| [E-10](#e-10--telephony--ocp-bridge-полное-подключение) | Telephony ↔ OCP Bridge (полное подключение) | 🟢 |
| [E-11](#e-11--sip-авторизация-из-ocp-creds) | SIP Авторизация из OCP `creds` | 🟢 |
| [E-12](#e-12--external-ocp-command-surface-p12-prep) | External OCP command surface (P12 prep) | 🟢 |
| [E-13](#e-13--i18n-полнота--integration-tests--wu-gate) | i18n, Integration Tests, WU Gate | 🟢 |
| [EXT](#ext--задел-на-будущее--external-sdk-gateway) | **Задел: External SDK Gateway** | 📋 Проектирование |

---

## Архитектурные правила для всех агентов

> **Читать перед написанием кода.**

1. **OCP — интеграция, не ядро.** SIP-телефония работает без OCP. OCP не должен попадать в `src/domain/telephony/` или `src/application/use-cases/telephony/`.
2. **Layering:** UI → Application → Domain → Ports → Adapters → Infrastructure. Нарушения недопустимы.
3. **Domain Events, не прямые вызовы.** Telephony не знает об OCP. OCP Bridge подписывается на доменные события Telephony через `DomainEventPublisher`.
4. **OCP Gateway — единственный WebSocket к OCP.** Никаких глобальных объектов (`window.ws`). Legacy `window.Softphone` **не портируется** — внешние вкладки через будущий `ExternalClientGateway` / `ExternalCommandRouter`.
5. **Settings → Интеграции → OCP Module** — единственное место конфигурации OCP в UI.
6. **Статус оператора в хедере** виден только когда `ocpSession.isAuthenticated === true`.
7. **i18n обязателен.** Все видимые строки → ключи в каталогах `ru`, `en`, `fr`, `de`, `bg`.
8. **Никакого downgrade Telephony.** Все тесты P01–P13 должны оставаться зелёными.
9. **UserSettings v7** — миграция v6→v7 с инъекцией дефолтов. Токен OCP — через `SecretStoragePort`, не в JSON.
10. **Facade — единственная точка входа** для всех вызовов снаружи (renderer, host-page, и в будущем — SDK). Use Cases пишутся независимо от источника вызова. Всегда передавай `callType: 'internal' | 'external' | 'sdk'` — это закладывает extensibility для External SDK (см. [EXT](#ext--задел-на-будущее--external-sdk-gateway)).

---

## Как обновлять этот файл

- При начале этапа: `🔴` → `🟡 В работе (WU-N, агент: /logic или /ui)`
- При завершении чеклиста: `🟡` → `🟢 Готово`
- Если этап частично выполнен: записать в «Примечания» что сделано и что осталось.
- Не создавать дубликаты — обновлять существующие записи.

---

## E-01 — Domain Model — Operator Bounded Context

**Статус:** 🟢 Готово (2026-07-13, `/logic`)  
**Команда:** `/logic`  
**Legacy IDs:** LF-018, LF-019, LF-041–LF-049  
**Зависимости:** нет (первый этап)

### Цель
Создать чистую доменную модель оператора OCP: типы статусов, FSM переходов, доменные события. Этот слой не знает ни о React, ни о WebSocket, ни об Electron.

### Направление реализации

**Паттерны для изучения перед началом:**
- `src/domain/telephony/CallStateMachine.ts` — как строится FSM с `validateTransition(from, to): Result<void, error>`
- `src/domain/telephony/events/` — как выглядят Domain Events (readonly, `correlationId`, `featureId`)
- `src/domain/shared/events/` — базовые типы событий

**Как реализовать `OperatorStatus`:**  
Не используй TypeScript `enum` — используй `const` + `type`, как это сделано в `src/domain/media/CallMediaMode.ts`. Это обеспечивает лучшую type safety и совместимость с сериализацией для будущего External SDK (числовые значения будут передаваться по WS).

```typescript
// Пример паттерна (не копировать — адаптировать):
export const OperatorStatus = {
  READY: 1,
  RINGING: 2,
  // ...
} as const;
export type OperatorStatus = (typeof OperatorStatus)[keyof typeof OperatorStatus];
```

**Как реализовать `OperatorStatusMachine`:**  
Следуй точно паттерну `CallStateMachine.ts`. FSM — это чистая функция без side-эффектов. `validateTransition` принимает `(from: OperatorStatus, to: OperatorStatus): Result<void, 'transition_not_allowed'>`. `isBusy` и `isWorking` — чистые предикаты. Никакого React, никакого state.

**Domain Events:**  
Каждое событие — отдельный файл в `src/domain/integration/ocp/events/`. Поля: только `readonly`. Обязательно: `readonly correlationId: CorrelationId`, `readonly featureId: 'F-028'`, `readonly timestamp: number`. Event для credentials (`OperatorCredentialsReceived`) **не должен** иметь поля `password` — только сигнал, что creds пришли, сами credentials передаются через отдельный typed channel.

**Для External SDK (задел):**  
`OperatorStatus` и `OperatorStatusReason` должны быть JSON-сериализуемыми (числа и строки, без Symbol, без class instances). Это важно: в будущем эти типы будут передаваться через local WebSocket в браузерный SDK.

### Файловая структура

```
src/domain/integration/ocp/
├── OperatorStatus.ts               — const enum + цвета (semantic keys) + метки (i18n keys)
├── OperatorStatus.test.ts
├── OperatorStatusReason.ts         — value object { id, parentStatus, defaultDescription }
├── OperatorProfile.ts              — entity { operatorId, status, reasonId, statusSince }
├── OperatorProfile.test.ts
├── OperatorStatusMachine.ts        — validateTransition, isBusy, isWorking, canUserInitiate
├── OperatorStatusMachine.test.ts
├── OcpTransitionRules.ts           — allowed transitions map
└── events/
    ├── OperatorStatusChanged.ts
    ├── OperatorSessionStarted.ts
    ├── OperatorSessionEnded.ts
    ├── OperatorLoggedOut.ts
    ├── OperatorStatusReservationSet.ts
    └── OperatorCredentialsReceived.ts   — NO password field, только signal
```

### Чеклист

- [x] Зарегистрировать **F-028** в `docs/softphone/Feature-Registry.md`
  - Context: Integration, Priority: high, Status: in-progress
  - Legacy IDs: LF-018, LF-019, LF-041–LF-049
- [x] `OperatorStatus` — `const` + `type` (не `enum`) со значениями 1–15:
  - `READY=1`, `RINGING=2`, `RESERVED_TO_CALL=3`, `TALKING=4`
  - `POST_CALL_PROCESSING=5`, `HOLD=6`, `BREAK=7`, `PREPARING_TO_WORK=8`
  - `LOGOUT=9`, `AUTH=10`, `RECONNECTED=11`, `DISCONNECTED=12`
  - `NEW_USER=13`, `PRE_CALL_PROCESSING=14`, `CONNECTION=15`
  - `OPERATOR_STATUS_COLOR: Record<OperatorStatus, string>` — semantic CSS-переменная (не hex)
  - `OPERATOR_STATUS_LABEL_KEY: Record<OperatorStatus, TranslationKey>` — i18n ключи
  - `USER_STATUSES_BUSY: ReadonlySet<OperatorStatus>` — RINGING, RESERVED_TO_CALL, TALKING, POST_CALL_PROCESSING, HOLD, PRE_CALL_PROCESSING, CONNECTION
  - `USER_STATUSES_WORKING: ReadonlySet<OperatorStatus>` — READY + все BUSY
- [x] `OperatorStatusReason` value object: `{ readonly id: number; readonly parentStatus: OperatorStatus; readonly defaultDescription: string }`
- [x] `OperatorProfile` entity:
  - `{ readonly operatorId: number; readonly status: OperatorStatus; readonly reasonId: number; readonly statusSince: Date }`
  - Метод `withUpdatedStatus(status, reasonId, since): OperatorProfile` → новый объект (иммутабельность)
- [x] `OcpTransitionRules.ts`:
  - `OPERATOR_STATUS_TRANSITIONS: ReadonlyMap<OperatorStatus, ReadonlyArray<OperatorStatus>>`
  - READY / BREAK / PREPARING_TO_WORK → [READY, BREAK, LOGOUT] (reason change + idle exits)
  - POST_CALL_PROCESSING → [READY, BREAK, LOGOUT]
  - Системные busy-статусы → пустой массив (клиент не инициирует apply; reserve идёт через Use Case)
- [x] `OperatorStatusMachine.ts`:
  - `validateTransition(from, to): Result<void, 'transition_not_allowed'>`
  - `isBusy(status): boolean`
  - `isWorking(status): boolean`
  - `canUserInitiate(status): boolean` — true только для READY, BREAK, LOGOUT
- [x] Domain Events (все readonly, все с `featureId: 'F-028'`):
  - `OperatorStatusChanged`: `{ operatorId, prevStatus, newStatus, reasonId, timestamp, correlationId, featureId }`
  - `OperatorSessionStarted`: `{ operatorId, domain, timestamp, correlationId, featureId }`
  - `OperatorSessionEnded`: `{ operatorId, reason: 'logout' | 'terminate' | 'error', timestamp, correlationId, featureId }`
  - `OperatorLoggedOut`: `{ operatorId, reasonId, timestamp, correlationId, featureId }`
  - `OperatorStatusReservationSet`: `{ operatorId, reservedStatus, reservedReasonId, correlationId, featureId }`
  - `OperatorCredentialsReceived`: `{ correlationId, featureId }` — **без пароля**, пароль передаётся отдельным secure channel
- [x] Тесты `OperatorStatusMachine.test.ts`:
  - READY → BREAK: valid; READY → LOGOUT: valid; BREAK → READY: valid
  - READY → RINGING: invalid (серверный); TALKING → BREAK: invalid (busy)
  - POST_CALL_PROCESSING → READY: valid
  - `isBusy(TALKING): true`; `isBusy(READY): false`
  - `canUserInitiate(READY): true`; `canUserInitiate(RINGING): false`
- [x] Тесты `OperatorProfile.test.ts`: иммутабельность, `withUpdatedStatus`

### Примечания
> E-01 завершён 2026-07-13. Доменные типы в `src/domain/integration/ocp/`. i18n-ключи статусов заложены как `OcpOperatorStatusLabelKey` (каталоги — на этапе E-13). Следующий этап: E-02 Port Contract.

---

## E-02 — Port Contract + OCP Protocol Types

**Статус:** 🟢 Готово (2026-07-13, `/logic`)  
**Команда:** `/logic`  
**Зависимости:** E-01

### Цель
Определить интерфейс `OcpGateway` и типизированные сообщения протокола OCP WebSocket. После этапа Domain и Application компилируются без адаптера.

### Направление реализации

**Паттерны для изучения:**
- `src/ports/headset/HeadsetGateway.ts` — как строится Gateway-порт с `Unsubscribe` callback
- `src/ports/telephony/TelephonyGateway.ts` — как выглядит gateway с командами и событиями
- `src/domain/media/events/videoMediaEvents.ts` — пример discriminated union для событий

**Как проектировать `OcpGateway`:**  
Gateway — это **порт**, не адаптер. Он описывает только контракт через TypeScript-интерфейс. Методы — минимально необходимые. Нет упоминания WebSocket, нет упоминания JSON. Адаптер (E-03) знает про WS; порт — нет.

Для `onMessage` и `onConnectionStateChange` используй паттерн callback с `Unsubscribe`:
```typescript
onMessage(handler: (msg: OcpIncomingMessage) => void): Unsubscribe;
```
Этот паттерн уже используется в `HeadsetGateway`. Он позволит в будущем легко заменить WS-транспорт на любой другой без изменения потребителей.

**Discriminated union для протокола:**  
Используй `kind` как дискриминатор (не `command` из wire-protocol — это деталь адаптера). Application и Domain видят только `kind`. Адаптер конвертирует `kind` → `{ command, entity, payload }` при отправке.

**Для External SDK (задел):**  
`OcpCommand` и `OcpIncomingMessage` — это типы APPLICATION-уровня. В будущем тот же `OcpCommand` может приходить не от renderer через IPC, а от браузерного SDK через local WebSocket. Поэтому все поля должны быть JSON-сериализуемыми. Не кладёте в команды ссылки на объекты, только примитивы и plain objects.

**`callType` — обязательное поле для команд изменения статуса:**  
`callType: 'internal' | 'external' | 'sdk'` — это будущий аудит-trail. Сейчас используются `'internal'` (из UI) и `'external'` (из host-page). Позже добавится `'sdk'` (из браузерного SDK). Заложи в тип сразу.

### Файловая структура

```
src/ports/integration/
└── OcpGateway.ts                   — интерфейс порта

src/domain/integration/ocp/
├── OcpConnectionConfig.ts          — { domain, authToken }
├── OcpConnectionState.ts           — union type (не enum)
└── protocol/
    ├── OcpCommand.ts               — discriminated union (kind-based)
    ├── OcpIncomingMessage.ts       — discriminated union (entity-based)
    └── OcpMessageEnvelope.ts       — wire-format { command, entity, payload, type }
```

### Чеклист

- [x] `OcpConnectionState` — union type:
  - `'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'reconnecting' | 'sessionClosed' | 'failed'`
- [x] `OcpConnectionConfig` value object:
  - `{ readonly domain: string; readonly authToken: string }`
  - Валидация: домен непустой, токен непустой
- [x] `OcpCommand` discriminated union (поле `kind`):
  - `{ kind: 'auth'; token: string }`
  - `{ kind: 'change_status_to_ready'; operatorId: number; reasonId: number; callType: 'internal' | 'external' | 'sdk' }`
  - `{ kind: 'change_status_to_break'; operatorId: number; reasonId: number; callType: 'internal' | 'external' | 'sdk' }`
  - `{ kind: 'change_status_to_logout'; operatorId: number; reasonId: number; callType: 'internal' | 'external' | 'sdk' }`
  - `{ kind: 'update_post_call_status'; operatorId: number; reasonId: number; reservedStatus: OperatorStatus }`
  - `{ kind: 'get_main_acallid'; callId; userLogin; callerId; calledId; lifecycleEvent }` — wire: `acallid` + `user_login` + `caller_id` + `called_id` + `event` (see `OCP-Call-Context.md`)
  - `{ kind: 'dlg_stop'; callId: string; acallId?: string }`
  - `{ kind: 'campaign_accept'; operatorId: number; campaignEventId: string }`
  - `{ kind: 'campaign_reject'; operatorId: number; campaignEventId: string }`
  - `{ kind: 'logging'; payload: Record<string, unknown> }` — для action-логов
- [x] `OcpIncomingMessage` discriminated union (поле `entity`):
  - `{ entity: 'creds'; data: OcpCredsPayload }`
  - `{ entity: 'users'; data: OcpUsersPayload }`
  - `{ entity: 'operator_status_reasons'; data: OcpStatusReasonPayload[] }`
  - `{ entity: 'notification'; data: OcpNotificationPayload }`
  - `{ entity: 'terminate' }`
  - `{ entity: 'campaign_events'; data: OcpCampaignEventPayload }`
  - `{ entity: 'calls'; data: OcpCallsPayload }`
  - `{ entity: 'Error'; data: { code: 'SESSION_EXIST' | 'INVALID_TOKEN' | string } }`
- [x] `OcpGateway` интерфейс:
  ```typescript
  export interface OcpGateway {
    connect(config: OcpConnectionConfig): void;
    disconnect(reason?: 'logout' | 'error'): void;
    sendCommand(cmd: OcpCommand): Result<void, PlatformError>;
    getConnectionState(): OcpConnectionState;
    onConnectionStateChange(handler: (state: OcpConnectionState) => void): Unsubscribe;
    onMessage(handler: (msg: OcpIncomingMessage) => void): Unsubscribe;
    dispose(): void;
  }
  ```
- [x] Экспорт через `src/ports/index.ts`
- [x] Compile-only тест: exhaustive switch по `OcpCommand.kind` и `OcpIncomingMessage.entity`

### Примечания
> E-02 завершён 2026-07-13. Порт `OcpGateway` и протокольные типы в `src/ports/integration/` и `src/domain/integration/ocp/protocol/`. Payload-типы нормализованы в camelCase для Application; wire snake_case — зона адаптера E-03. Следующий этап: E-03 WebSocket Adapter (`/adapter`).

---

## E-03 — WebSocket Адаптер

**Статус:** 🟢 Готово (2026-07-13, `/adapter`)  
**Команда:** `/adapter`  
**Зависимости:** E-01, E-02

### Цель
Реализовать `OcpWebSocketAdapter` и `MockOcpGateway`. Адаптер инкапсулирует WebSocket, авторизацию, реконнект и парсинг сообщений. Никакой бизнес-логики внутри.

### Направление реализации

**Паттерны для изучения:**
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts` — как адаптер инкапсулирует внешнюю lib
- `src/domain/shared/recovery/ReconnectScheduler.ts` — **уже есть готовый планировщик реконнекта**, использовать его вместо ручного `setTimeout`
- `src/adapters/updates/FetchUpdateMetadataAdapter.ts` — как парсить `unknown` в `Result`
- `src/adapters/mock/MockHeadsetGateway.ts` — паттерн mock gateway

**Как реализовать `OcpWebSocketAdapter`:**  
Адаптер — это класс с инъекцией зависимостей через конструктор: `constructor(deps: { logger: Logger })`. Состояние WS инкапсулировано: `private ws: WebSocket | null = null`. Нет публичных геттеров на WebSocket.

Реконнект: **используй `ReconnectScheduler`** из `src/domain/shared/recovery/` вместо ручного `setTimeout`. Это обеспечит: корректный cleanup, соблюдение лимитов попыток, паузу во время активных звонков (если нужно в будущем). `ReconnectScheduler.cancel()` вызывается в `dispose()`.

```typescript
// Концептуальный скелет:
class OcpWebSocketAdapter implements OcpGateway {
  private ws: WebSocket | null = null;
  private reconnectScheduler: ReconnectScheduler;
  private connectionState: OcpConnectionState = 'disconnected';
  private messageHandlers = new Set<(msg: OcpIncomingMessage) => void>();
  private stateHandlers = new Set<(state: OcpConnectionState) => void>();

  connect(config: OcpConnectionConfig): void {
    this.config = config;
    this.createWebSocket();
  }

  private createWebSocket(): void {
    this.setConnectionState('connecting');
    this.ws = new WebSocket(`wss://${this.config.domain}/ws`);
    this.ws.onopen = () => this.handleOpen();
    this.ws.onmessage = (e) => this.handleMessage(e);
    this.ws.onclose = () => this.handleClose();
    this.ws.onerror = (e) => this.logger.error('OcpWS error', { featureId: 'F-028' });
  }
}
```

**`parseOcpMessage`:**  
Следуй `parseUpdateManifest.ts` — принимает `unknown`, возвращает `Result`. При неизвестном `entity` — `Result.err` + `logger.debug` (не `warn`/`error` — OCP может добавлять новые entity в будущем).

**`MockOcpGateway`:**  
Следуй `src/adapters/mock/MockHeadsetGateway.ts`. Ключевые методы: `simulateMessage(msg)`, `simulateDisconnect()`, `getSentCommands(): ReadonlyArray<OcpCommand>`. Это нужно для тестов Use Cases и Bridge Services без реального WS.

**SESSION_EXIST guard:**  
При получении `Error { code: 'SESSION_EXIST' | 'INVALID_TOKEN' }` → `this.setConnectionState('sessionClosed')` → **не запускать реконнект**. Это критично: иначе адаптер будет флудить сервер повторными подключениями.

### Файловая структура

```
src/adapters/integration/ocp/
├── OcpWebSocketAdapter.ts
├── OcpWebSocketAdapter.test.ts
├── parseOcpMessage.ts
├── parseOcpMessage.test.ts
└── buildOcpCommandPayload.ts       — OcpCommand.kind → { command, entity, payload, type }

src/adapters/mock/
└── MockOcpGateway.ts
```

### Чеклист

- [x] `OcpWebSocketAdapter`:
  - `connect(config)`: URL = `wss://{domain}/ws`, создаёт WS, вешает handlers
  - `onopen`: отправляет auth команду `{ command: "auth", entity: "proxy_users", payload: token, type: "auth_proxy_users" }`
  - `onmessage`: `parseOcpMessage(e.data)` → dispatch через `messageHandlers`
  - При `entity: 'Error'` → `setConnectionState('sessionClosed')` если SESSION_EXIST/INVALID_TOKEN
  - При `entity: 'users'` и первый раз → `setConnectionState('authenticated')`
  - `onclose`: если `state !== 'sessionClosed'` → `reconnectScheduler.schedule(createWebSocket)`
  - `onerror`: логировать, не выбрасывать
  - `sendCommand(cmd)`: `ws.readyState === WebSocket.OPEN` ? send : `Result.err`
  - `dispose()`: `reconnectScheduler.cancel()`, `ws.close()`, очистить handlers
- [x] Политика реконнекта через `ReconnectScheduler`: 5с задержка, max 6 попыток, при исчерпании `state = 'failed'`
- [x] `parseOcpMessage.ts`: `unknown` → `ParseOcpMessageResult` (`unknown_entity` | `parse_error`)
  - Нормализация `users[].status.reason_id`: `null/undefined` → `0`
  - Неизвестный entity → `Result.err + logger.debug`
- [x] `buildOcpCommandPayload.ts`: маппинг `OcpCommand.kind` → wire-format JSON
- [x] `MockOcpGateway.ts`:
  - `simulateMessage(msg: OcpIncomingMessage): void`
  - `simulateDisconnect(): void`
  - `simulateAuthSuccess(operatorId: number): void` — shortcut для тестов
  - `getSentCommands(): ReadonlyArray<OcpCommand>`
  - `getLastSentCommand(): OcpCommand | undefined`
  - `clearSentCommands(): void`
- [x] Тесты `OcpWebSocketAdapter.test.ts`:
  - connect → WS создан с правильным URL
  - onopen → auth команда отправлена
  - `Error SESSION_EXIST` → state = 'sessionClosed', реконнект не запускается
  - onclose → реконнект запущен через ReconnectScheduler
  - 6 попыток → state = 'failed'
  - dispose() → ReconnectScheduler.cancel вызван
  - sendCommand когда `!OPEN` → `Result.err`
- [x] Тесты `parseOcpMessage.test.ts`:
  - creds → OK; users с null reason_id → нормализован; unknown entity → err

### Примечания
> E-03 завершён 2026-07-13. `OcpWebSocketAdapter`, `parseOcpMessage`, `buildOcpCommandPayload`, `MockOcpGateway` в `src/adapters/`. `ReconnectScheduler` вынесен в `src/shared/scheduling/` для использования адаптерами без импорта Application. Следующий этап: E-04 Use Cases (`/logic`).

---

## E-04 — Application — Use Cases

**Статус:** 🟢 Готово (2026-07-13, `/logic`)  
**Команда:** `/logic`  
**Зависимости:** E-01, E-02

### Цель
Реализовать все Use Cases для управления OCP-сессией и статусом оператора. Работают только через `OcpGateway` порт.

### Направление реализации

**Паттерны для изучения:**
- `src/application/use-cases/telephony/HoldCallUseCase.ts` — эталонный Use Case: конструктор с deps, `execute(): Promise<Result<void, PlatformError>>`, логирование
- `src/application/use-cases/telephony/AnswerCallUseCase.ts` — как логировать operation + correlationId
- `src/application/use-cases/telephony/EndUserSessionUseCase.ts` — каскадные операции

**Структура каждого Use Case:**
```typescript
export class ChangeOperatorStatusUseCase {
  constructor(private readonly deps: {
    ocpGateway: OcpGateway;
    operatorReadModel: OcpOperatorReadModel;  // порт read-model
    statusMachine: OperatorStatusMachine;
    logger: Logger;
  }) {}

  async execute(cmd: ChangeOperatorStatusCommand): Promise<Result<void, PlatformError>> {
    const correlationId = generateCorrelationId();
    this.deps.logger.info('ChangeOperatorStatus:start', {
      correlationId, from: cmd.fromStatus, to: cmd.targetStatus,
      featureId: 'F-028', callType: cmd.callType
    });
    // ... логика ...
    this.deps.logger.info('ChangeOperatorStatus:done', { correlationId, featureId: 'F-028' });
    return Result.ok(undefined);
  }
}
```

**`ChangeOperatorStatusUseCase` — ключевая логика:**  
1. Получить текущий статус из `OcpOperatorReadModel`  
2. Если DND активен + цель READY → `Result.err('dnd_blocks_ready')` (через `DndReadModel`)  
3. Вызвать `OperatorStatusMachine.validateTransition(current, target)` → если fail → `Result.err`  
4. Если `isBusy(currentStatus)` → команда `update_post_call_status` (резервирование)  
5. Если не занят → команда `change_status_to_ready|break`  
6. `sendCommand()` → если `Result.err` → логировать + вернуть err  

**`callType` в командах:**  
Все команды изменения статуса принимают `callType: 'internal' | 'external' | 'sdk'`. Renderer UI → `'internal'`. Host-page API → `'external'`. Публичный Axatalk SDK (DI-07) → `'sdk'` на Facade/Use Case (аудит). Use Case **не зависит** от источника — он только передаёт callType в `OcpCommand`.

**OCP wire (обязательно):** legacy `proxy_users` принимает только `function_call_type: 'internal' | 'external'`. Адаптер `mapOcpCallTypeToWire` / `buildOcpCommandPayload` мапит Application `'sdk'` → wire `'external'`. Не отправлять `"sdk"` на OCP socket и не подменять Facade `callType` на `"external"` молча (см. ADR-0017 O-OCP-1).

**`LogoutOperatorUseCase` — каскад:**  
Logout из OCP и logout из SIP — **разные операции**. По умолчанию `cascadeSipLogout: false`. Если оператор хочет выйти и из SIP — это отдельная опция. Не создавай double-logout как в legacy. `change_status_to_logout` отправляется только один раз.

**`OcpOperatorReadModel` — интерфейс read-model:**  
Создай в `src/ports/integration/OcpOperatorReadModel.ts`. Методы: `getCurrentOperatorProfile(): OperatorProfile | null`, `getReservedStatus(): OperatorStatus | null`. Реализуется через Zustand projection (E-05).

### Файловая структура

```
src/application/use-cases/integration/ocp/
├── ConnectOcpUseCase.ts + .test.ts
├── DisconnectOcpUseCase.ts + .test.ts
├── ChangeOperatorStatusUseCase.ts + .test.ts
├── LogoutOperatorUseCase.ts + .test.ts
├── ReservePostCallStatusUseCase.ts + .test.ts
├── AcceptCampaignUseCase.ts + .test.ts
└── RejectCampaignUseCase.ts + .test.ts

src/ports/integration/
└── OcpOperatorReadModel.ts         — интерфейс read-model для Use Cases
```

### Чеклист

- [x] `OcpOperatorReadModel` port: `getCurrentOperatorProfile(): OperatorProfile | null`, `getReservedStatus(): OperatorStatus | null`
- [x] `ConnectOcpUseCase`: `execute({ domain, authToken }): Promise<Result<void, PlatformError>>` → `gateway.connect(config)`; логирует domain (без токена!)
- [x] `DisconnectOcpUseCase`: `execute(): Promise<Result<void, PlatformError>>` → `gateway.disconnect('logout')`
- [x] `ChangeOperatorStatusUseCase`:
  - Input: `{ targetStatus: 'ready' | 'break'; reasonId: number; callType: 'internal' | 'external' | 'sdk' }`
  - DND guard → `Result.err('dnd_blocks_ready')`
  - FSM validation → `Result.err('transition_not_allowed')`
  - busy → `update_post_call_status`; idle → `change_status_to_ready|break`
  - Тесты: busy routing, idle routing, DND guard, FSM reject
- [x] `LogoutOperatorUseCase`:
  - Input: `{ reasonId: number; cascadeSipLogout?: boolean; callType: 'internal' | 'external' | 'sdk' }`
  - Отправляет `change_status_to_logout`
  - Вызывает `gateway.disconnect('logout')` → state = 'sessionClosed'
  - Если `cascadeSipLogout` → публикует `OperatorLoggedOut` event (Application сервис слушает и вызывает `EndUserSessionUseCase`)
  - Тест: команда отправлена, disconnect вызван, SIP logout опционален
- [x] `ReservePostCallStatusUseCase`: `execute({ operatorId, targetStatus, reasonId })` → всегда `update_post_call_status`
- [x] `AcceptCampaignUseCase` / `RejectCampaignUseCase`: `execute({ operatorId, campaignEventId })` → команда
- [x] Все Use Cases: `Result<void, PlatformError>`, корреляция, `featureId: 'F-028'`

### Примечания
> E-04 завершён 2026-07-13. Use Cases в `src/application/use-cases/integration/ocp/`, порты `OcpOperatorReadModel` и `DndReadModel`. Busy-операторы резервируют статус через `update_post_call_status` без FSM-проверки (как в legacy). Следующий этап: E-05 Projections + Bridge Services (`/logic`).

---

## E-05 — Application — Projections + Bridge Services

**Статус:** 🟢 Готово (2026-07-14, `/logic`)  
**Команда:** `/logic`  
**Зависимости:** E-01, E-02, E-03 (MockOcpGateway), E-04

### Цель
Создать Zustand-проекции для OCP-состояния и Application-сервисы-мосты. Мосты подписываются на Domain Events и связывают OCP ↔ Telephony ↔ DND без прямой зависимости контекстов.

### Направление реализации

**Паттерны для изучения:**
- `src/application/projections/telephony/` — как устроены Zustand store slices
- `src/application/services/headset/HeadsetIntegrationService.ts` — **эталонный bridge service**: subscribe в constructor, `dispose()` в destructor, использует `DomainEventPublisher`
- `src/application/projections/platform/accountBootstrapProjection.ts` — как projection читает состояние gateway

**Zustand Projections:**  
Каждая проекция — это Zustand store slice. Состояние обновляется **только** через `onMessage` и `onConnectionStateChange` callbacks от `OcpGateway`. Renderer читает проекции через selectors.

**`OcpOperatorReadModel` реализация:**  
Проекция `operatorStatusProjection` реализует интерфейс `OcpOperatorReadModel` из E-04. Это позволяет Use Cases получать текущее состояние оператора без прямого импорта Zustand в Application.

**Bridge Services — принцип:**  
```typescript
class OcpTelephonyBridgeService {
  private unsubscribers: Unsubscribe[] = [];

  constructor(private deps: {
    eventPublisher: DomainEventPublisher;
    ocpGateway: OcpGateway;
    // ...
  }) {
    this.unsubscribers.push(
      deps.eventPublisher.subscribe(CallEndedEvent, this.handleCallEnded.bind(this))
    );
  }

  private handleCallEnded(event: CallEndedEvent): void {
    if (!this.isOcpAuthenticated()) return;
    this.deps.ocpGateway.sendCommand({ kind: 'dlg_stop', callId: event.callId });
  }

  dispose(): void {
    this.unsubscribers.forEach(u => u());
  }
}
```

**`OcpCallCorrelationMap`:**  
Простой `Map<CallId, string>` внутри `OcpTelephonyBridgeService`. Заполняется когда приходит `entity: 'calls'` с acallId. Очищается при `CallEnded`/`CallFailed`. **Нет `setInterval`** — только event-driven. Это исправляет критический баг legacy (interval всегда был 0).

**Для External SDK (задел):**  
Projection state должен быть **сериализуемым** — только примитивы, массивы и plain objects в store. Это важно: в будущем `ocpSessionProjection` и `operatorStatusProjection` будут отдаваться по local WebSocket браузерному SDK как JSON push-сообщения.

### Файловая структура

```
src/application/projections/integration/
├── ocpSessionProjection.ts + .test.ts
├── operatorStatusProjection.ts + .test.ts   — реализует OcpOperatorReadModel
├── ocpReasonsProjection.ts + .test.ts
└── campaignEventProjection.ts

src/application/services/integration/
├── OcpTelephonyBridgeService.ts + .test.ts
├── OcpDndBridgeService.ts + .test.ts
├── OcpNotificationService.ts + .test.ts
└── OcpSipCredentialService.ts               — stub, полная реализация в E-11
```

### Чеклист

#### Проекции

- [x] `ocpSessionProjection`:
  - State: `{ connectionState: OcpConnectionState; isAuthenticated: boolean; domain: string | null; proxyStatus: 'SESSION_EXIST' | 'INVALID_TOKEN' | null; reconnectAttempt: number }`
  - Обновляется из `gateway.onConnectionStateChange` и `gateway.onMessage` (entity: 'Error')
  - Selectors: `selectIsOcpConnected`, `selectOcpProxyStatus`, `selectOcpDomain`
  - Тест: полный цикл состояний, SESSION_EXIST block
- [x] `operatorStatusProjection` (реализует `OcpOperatorReadModel`):
  - State: `{ operatorId: number | null; status: OperatorStatus | null; reasonId: number; statusSince: number | null; isBusy: boolean; reservedStatus: OperatorStatus | null; reservedReasonId: number | null }`
  - Обновляется из `entity: 'users'` → `users[0]`
  - Selectors: `selectOperatorStatus`, `selectOperatorIsBusy`, `selectIsCallButtonBlocked`
  - `getCurrentOperatorProfile()` и `getReservedStatus()` реализуют `OcpOperatorReadModel`
  - Тест: обновление, нормализация reason_id
- [x] `ocpReasonsProjection`:
  - State: `{ readyReasons: OperatorStatusReason[]; breakReasons: OperatorStatusReason[]; logoutReasons: OperatorStatusReason[] }`
  - Обновляется из `entity: 'operator_status_reasons'`
  - localStorage кэш ключ `ocp-break-reasons-{operatorId}`
  - Тест: фильтрация по parentStatus
- [x] `campaignEventProjection`:
  - State: `{ activeCampaign: OcpCampaignEventPayload | null; progressiveContext: OcpCampaignEventPayload | null }` — preview (`progressive: false`) → `activeCampaign` (modal); progressive → `progressiveContext` (badges only). See `docs/softphone/OCP-Call-Context.md`.
  - Тест: set/clear

#### Bridge Services

- [x] `OcpTelephonyBridgeService`:
  - `IncomingCallReceived` → `get_main_acallid`
  - `OutgoingCallStarted` → `get_main_acallid`
  - `CallAnswered` → `get_main_acallid` (sync)
  - `CallEnded` / `CallFailed` → `dlg_stop` (lookup из OcpCallCorrelationMap)
  - `entity: 'calls'` → обновить OcpCallCorrelationMap
  - Map очищается при CallEnded/CallFailed
  - Если `!isAuthenticated` → пропускать команды
  - `dispose()` — снять все подписки
  - Тест: CallEnded → dlg_stop; без auth → нет команд
- [x] `OcpDndBridgeService`:
  - `PhoneStatusChanged { dnd: true }` + idle → `ChangeOperatorStatusUseCase({ targetStatus: 'break', callType: 'internal' })`
  - `PhoneStatusChanged { dnd: true }` + busy → `ReservePostCallStatusUseCase`
  - Тест: DND on idle → break; DND on busy → reserve
- [x] `OcpNotificationService`:
  - `entity: 'notification'` → `OcpNotificationPresenter.present` (UI wires toast in E-09 / T-021)
  - Тест: notification entity → presenter called
- [x] `OcpSipCredentialService` — stub (полная реализация в E-11)
- [x] Bootstrap wiring в `createRealAccountBootstrap.ts`:
  - Создать `OcpWebSocketAdapter`, передать в Use Cases и Bridge Services
  - Bridge Services стартуют при инициализации
  - `dispose()` вызывается при `ShutdownCleanupUseCase`
- [x] `createMockAccountBootstrap.ts`: использовать `MockOcpGateway`

### Примечания
> E-05 завершён 2026-07-14. Application projections — чистые reduce/selectors (сериализуемые); runtime hub `OcpProjectionHub` реализует `OcpOperatorReadModel`. Zustand wiring в renderer — подзадача `/ui` (T-021). Notification через порт `OcpNotificationPresenter`, не прямой импорт renderer. Next: E-06.

---

## E-06 — UserSettings v7 + Settings UI (Integrations)

**Статус:** 🟢 Schema + Facade + Settings Integrations UI готовы (2026-07-14, T-021 `/ui`)
**Команда:** `/logic` (схема) + `/ui` (панель) — done
**Зависимости:** E-01, E-04

### Цель
Добавить OCP конфигурацию в `UserSettings`, создать раздел «Интеграции» в Settings с подпанелью «OCP Module». Токен OCP — только через `SecretStoragePort`.

### Направление реализации

**Паттерны для изучения:**
- `src/domain/settings/migrateUserSettings.ts` — как делать additive migration (v6→v7)
- `src/domain/settings/validateUserSettings.ts` — как валидировать новые поля
- `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx` — структура Settings-панели
- `src/application/facades/AccountBootstrapFacade.ts` — как добавлять facade actions

**Миграция v6→v7:**  
Additive: если поле отсутствует — инъектировать `OCP_INTEGRATION_DEFAULTS`. Никогда не менять существующие поля. Следуй паттерну миграции v5→v6 в `migrateUserSettings.ts`.

**Токен не в JSON:**  
`OcpIntegrationSettings` содержит `domain`, `enabled`, флаги. Токен хранится только через `SecretStoragePort` с ключом `'ocp-token'`. Facade имеет методы `saveOcpToken`, `getOcpToken`, `deleteOcpToken`. Это защищает от случайного логирования токена (уже есть инфраструктура в `assertPersistedProfileJsonExcludesSecrets.ts`).

**`SettingsIntegrationsPanel`:**  
Следуй структуре `SettingsHeadsetPanel.tsx`:
1. Hook `useOcpSettingsPanel` — читает проекции, предоставляет action callbacks
2. Компонент — только render + props, никаких use cases напрямую
3. Facade calls через `useSettingsActions` (расширить его)

**Для External SDK (задел):**  
В будущем Settings → Integrations может включать не только OCP, но и конфигурацию local WebSocket server для SDK (порт, токен аутентификации). Проектируй `SettingsIntegrationsPanel` как extensible: не хардкодь OCP как единственную интеграцию — структура card/section должна легко добавлять новые карточки (CRM, SDK Server config, etc.).

### Файловая структура

```
src/domain/settings/
├── UserSettings.ts                 — SETTINGS_SCHEMA_VERSION = 7, + ocpIntegration field
├── OcpIntegrationSettings.ts       — value object + defaults + validate
├── migrateUserSettings.ts          — добавить v6→v7
└── validateUserSettings.ts         — добавить валидацию ocpIntegration

src/renderer/components/settings/
├── settingsSections.ts             — добавить "integrations"
└── panels/
    ├── SettingsIntegrationsPanel.tsx + .module.css + .test.tsx
    └── OcpModuleSettingsCard.tsx   — sub-card OCP
```

### Чеклист

#### Domain

- [x] `OcpIntegrationSettings`:
  ```typescript
  type OcpIntegrationSettings = {
    readonly enabled: boolean;
    readonly domain: string;
    readonly autoConnect: boolean;   // подключаться при старте
    readonly autoSipAuth: boolean;   // SIP auth из OCP creds
  };
  const OCP_INTEGRATION_DEFAULTS: OcpIntegrationSettings = {
    enabled: false, domain: '', autoConnect: false, autoSipAuth: false
  };
  ```
- [x] `SETTINGS_SCHEMA_VERSION = 7` в `UserSettings.ts`
- [x] Поле `ocpIntegration: OcpIntegrationSettings` в `UserSettings`
- [x] `migrateUserSettings` v6→v7: инъектировать `OCP_INTEGRATION_DEFAULTS`
- [x] `validateUserSettings`: валидировать `ocpIntegration.domain` (строка, допустима пустая)
- [x] Тесты миграции и валидации
- [x] Токен **не в `UserSettings`** — только через `SecretStoragePort` с ключом `'ocp-token'`
- [x] Facade actions: `updateOcpSettings`, `saveOcpToken` / `getOcpToken` / `deleteOcpToken`, `connectOcp` / `disconnectOcp`

#### Renderer

- [x] `settingsSections.ts`: добавить `"integrations"` в `SettingsSectionId` и `SETTINGS_NAV_ITEMS`
  - `labelKey: "settings.nav.integrations"`, `iconId: "settings.integrations"`, `testId: "settings-nav-integrations"`
- [x] Иконка `settings.integrations` в `iconCatalog.ts` (Lucide `Plug`) + запись в `Icon-Registry.md`
- [x] Hook `useOcpSettingsPanel`: читает `ocpSessionProjection`, вызывает facade actions
- [x] `SettingsIntegrationsPanel.tsx`: заголовок + `OcpModuleSettingsCard` (extensible структура)
- [x] `OcpModuleSettingsCard.tsx`:
  - Toggle «Включить OCP Module» (enabled)
  - Поле «OCP Domain», Toggle «Автоподключение», Toggle «Авторизовать SIP из OCP»
  - Поле токена (type=password, show/hide) + кнопка «Сохранить токен» / «Удалить токен»
  - Кнопка «Подключиться» / «Отключиться» + статус-индикатор
  - `data-testid="ocp-module-settings-card"`
- [x] Добавить `SettingsIntegrationsPanel` в `SettingsPanel.tsx`
- [x] i18n ключи (ru, en, fr, de, bg)
- [x] Тесты: enabled/disabled state, domain required guard, token save/delete, connect/disconnect
- [x] Zustand OCP projections sync + toast presenter → `useNotifications`

### Примечания
> E-06 полностью закрыт 2026-07-14 (T-021 `/ui`): Integrations panel, OCP card, projection wiring, toast sink. Next: E-07 status selector или E-10/E-11.

---

## E-07 — UI — Operator Status Selector в хедере

**Статус:** 🟢 Готово (2026-07-14)  
**Команда:** `/ui`  
**Зависимости:** E-04, E-05, E-06

### Цель
Виджет выбора статуса оператора в шапке. Виден только когда `isAuthenticated === true`. Использует UI Kit primitives.

### Направление реализации

**Паттерны для изучения:**
- `src/renderer/components/ui/dropdown-menu/` — Radix DropdownMenu (уже в UI Kit)
- `src/renderer/components/header/SoftphoneShellHeader.tsx` — точка интеграции виджета
- `src/renderer/widgets/SoftphoneLayout/` — как устроены widgets

**Hook `useOperatorStatusSelector`:**  
Этот hook — единственный consumer проекций. Компонент получает только `vm` объект. Hook возвращает view model: `{ statusColor, reasonLabel, timerSince, dropdownItems, isDropdownDisabled, dropdownDisabledReason, isReconnecting, reconnectAttempt }`. Никаких прямых импортов Zustand в компонент.

**`OcpStatusDropdown` — Radix DropdownMenu:**  
Используй уже существующий `DropdownMenu` из UI Kit. Группы через `DropdownMenu.Group` + `DropdownMenu.Label`. Ready-causes и Break-causes — две отдельные группы. Disabled items через Radix `disabled` prop + `Tooltip` для причины (используй `IconTooltip`).

**Status color dot:**  
Используй CSS-переменную из semantic tokens, не hardcode hex. Например, READY → `var(--color-status-available)`, BREAK → `var(--color-status-away)`, BUSY → `var(--color-status-busy)`.

**`OcpStatusTimer`:**  
```typescript
function OcpStatusTimer({ since }: { since: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - since), 1000);
    return () => clearInterval(id);
  }, [since]);
  // ...
}
```
Обязателен cleanup через `return () => clearInterval(id)`.

**Интеграция в хедер:**  
Добавить между DND-toggle и avatar-кнопкой. Условный рендер: `{isOcpAuthenticated && <OperatorStatusSelector />}`. Не изменять layout хедера для неаутентифицированного состояния.

**Для External SDK (задел):**  
View model из `useOperatorStatusSelector` — это именно тот набор данных, который нужно транслировать в SDK. В будущем `ocpSessionProjection` и `operatorStatusProjection` будут сериализоваться и пушиться по local WebSocket. Убедись, что projection state содержит только serializable значения.

### UX States

| Состояние | Виджет |
|-----------|--------|
| `!isAuthenticated` | не рендерится |
| READY | зелёная точка + label + таймер |
| BREAK | оранжевая точка + label + таймер |
| Системный статус (TALKING и т.д.) | серая точка + label, dropdown disabled |
| `connectionState === 'reconnecting'` | `OcpConnectionBanner` (баннер в хедере) |
| `proxyStatus === 'SESSION_EXIST'` | `OcpProxyStatusScreen` (overlay) |

### Файловая структура

```
src/renderer/widgets/OperatorStatusSelector/
├── OperatorStatusSelector.tsx + .module.css + .test.tsx + .stories.tsx
└── hooks/useOperatorStatusSelector.ts

src/renderer/components/integration/ocp/
├── OcpStatusDropdown.tsx + .module.css + .test.tsx
├── OcpStatusTimer.tsx + .test.tsx
├── OcpConnectionBanner.tsx + .module.css + .test.tsx
└── OcpProxyStatusScreen.tsx + .module.css
```

### Чеклист

- [x] `useOperatorStatusSelector`: pure view model, никаких Zustand в компоненте
- [x] `OperatorStatusSelector.tsx`:
  - Не рендерится если `!isAuthenticated`
  - Status dot + reasonLabel + `OcpStatusTimer` + chevron → trigger для `OcpStatusDropdown`
  - `data-testid="ocp-status-selector"`, CSS Modules + semantic tokens, light + dark
- [x] `OcpStatusDropdown`: Radix DropdownMenu, группы Ready/Break, disabled states с tooltip
  - Ready disabled если SIP не зарегистрирован: `data-testid="ocp-ready-disabled-sip"`
  - Ready disabled если DND: `data-testid="ocp-ready-disabled-dnd"`
  - Skip если same reasonId выбран
- [x] `OcpStatusTimer`: `useCallDuration` (interval + cleanup), `aria-label`
- [x] `OcpConnectionBanner`:
  - reconnecting: «Переподключение… (попытка N из 6)»
  - failed: «Не удалось подключиться. Попробовать снова?»
  - Кнопка Retry → `facade.connectOcp()`, `data-testid="ocp-retry-connect"`
- [x] `OcpProxyStatusScreen`: blocking overlay, SESSION_EXIST/INVALID_TOKEN, кнопка → Settings → Integrations
- [x] Интеграция в `SoftphoneShellHeader.tsx` + `SoftphoneReadyShell.tsx`
- [x] i18n ключи для ru, en, fr, de, bg: `ocp.status.*`, `ocp.dropdown.*`, `ocp.connection.*`, `ocp.proxyStatus.*`, `ocp.operatorStatus.*`
- [x] Тесты: hidden when !auth, busy disables dropdown, DND guard, click → Use Case called
- [x] Stories: authenticated/disconnected/busy/dnd-guard (light + dark)

### Примечания
> Hook: `src/renderer/hooks/useOperatorStatusSelector.ts` (не widgets/hooks — eslint/UI-Architecture + facade pattern как `useOcpSettingsPanel`).
> Chrome tests: `OcpStatusChrome.test.tsx` (timer/banner/proxy). Retry = `AccountBootstrapFacade.connectOcp`.

---

## E-08 — UI — Модальное окно выхода с причиной

**Статус:** 🟢 Готово  
**Команда:** `/ui`  
**Зависимости:** E-04, E-05, E-07

### Цель
Модальное окно выбора причины выхода из OCP. Вход — из пункта «Выйти» меню аватара.

### Направление реализации

**Паттерны:**
- `ShellDialpadPanel` `sidebar` — тот же left slide-in, что contacts/history (не modal scrim)
- `LogoutOperatorUseCase` + SIP cascade через `OperatorLoggedOut` (Application)

**Ключевой момент — единая кнопка «Выйти»:**  
Если `ocpIntegration.enabled && isAuthenticated` → fullscreen overlay с радио-причинами → confirm → OCP logout (`cascadeSipLogout: true`) + SIP logout.  
Если модуль выключен / нет OCP auth → только SIP logout (как раньше).  
Отдельный пункт «Выйти из OCP» **не** добавлялся (override плана по запросу продукта).

**Радио-список причин:**  
Native `<input type="radio">` + CSS Modules. Confirm `disabled` без выбора / при empty list / submitting.

### Файловая структура

```
src/renderer/components/integration/ocp/
├── OcpLogoutReasonModal.tsx + .module.css + .test.tsx
src/renderer/hooks/useOcpLogoutModal.ts + .test.ts
```

### Чеклист

- [x] `OcpLogoutReasonModal.tsx`: ShellDialpadPanel sidebar (contacts/history-like), радио-список, Cancel + Confirm
  - `data-testid`: `ocp-logout-reasons-modal`, `ocp-logout-cancel`, `ocp-logout-confirm`
  - Escape → закрыть без выхода
  - CSS Modules + semantic tokens, light + dark
- [x] `useOcpLogoutModal`: open/close, selectedReasonId, confirm → LogoutOperator + SIP end session
- [x] Интеграция в avatar menu logout branch (не отдельный пункт)
- [x] i18n (ru, en, fr, de, bg): `ocp.logout.modal.*`
- [x] Тесты: OCP off → SIP; confirm disabled без выбора; confirm → Use Case + SIP

### Примечания
Реализовано 2026-07-14. Продуктовый override: cascade OCP+SIP с одной кнопки «Выйти».

---

## E-09 — UI — Кампании + OCP Уведомления

**Статус:** 🟢 Готово (2026-07-14)  
**Команда:** `/ui`  
**Зависимости:** E-04, E-05

### Цель
Модальное окно кампании (accept/reject) и подключение OCP-уведомлений к существующей toast-системе.

### Направление реализации

**Паттерны:**
- `src/renderer/components/updates/UpdateAvailableBanner.tsx` — overlay/modal поверх shell
- `src/renderer/hooks/useNotifications.ts` + `NotificationViewport` в `SoftphoneReadyShell` — существующая toast-система (отдельного `notificationStore` нет и не создавать)

**OCP Notifications → Toast:**  
`OcpNotificationService` (E-05) вызывает порт `OcpNotificationPresenter` (сейчас `NoopOcpNotificationPresenter`). В E-09 UI даёт реализацию: `present(payload)` → map в `NotificationDescriptor` → `notify(...)` из `useNotifications` в `SoftphoneReadyShell` (тот же канал, что телефония/аккаунт). Никаких новых toast-механизмов и Zustand store для нотификаций — переиспользовать существующий хук. Store имеет смысл только позже, если toast sink понадобится вне React (host-page / SDK).

**`CampaignEventModal`:**  
Не закрывается по Escape (обязательный выбор — принять или отклонить). Показывается когда `campaignEventProjection.activeCampaign !== null` (**только non-progressive preview**). Progressive → бейджи на call surfaces, без модалки. Модалка: center + blur scrim, компактный phone hero. После Accept/Reject / CallEnded — слоты очищаются. Queue badges: `CallOcpContextProjection` (`docs/softphone/OCP-Call-Context.md`).

### Файловая структура

```
src/renderer/components/integration/ocp/
├── OcpCampaignEventModal.tsx + .module.css + .test.tsx
└── (presentational)

src/renderer/hooks/useOcpCampaignModal.ts + .test.ts

src/renderer/integration/ocp/
└── createOcpToastNotificationPresenter.ts  — done in T-021
```

### Чеклист

- [x] `OcpCampaignEventModal.tsx`: UI Kit Dialog, no Escape close, Accept + Reject кнопки
  - `data-testid`: `ocp-campaign-modal`, `ocp-campaign-accept`, `ocp-campaign-reject`
  - CSS Modules + semantic tokens, light + dark
- [x] `useOcpCampaignModal`: читает `campaignEventProjection`, вызывает Accept/Reject use cases
- [x] Интеграция в overlay layer `SoftphoneReadyShell`
- [x] OCP Notification toasts: UI-реализация `OcpNotificationPresenter` → `useNotifications.notify` (без `notificationStore`) — done in T-021
- [x] i18n (ru, en, fr, de, bg): `ocp.campaign.modal.*`
- [x] Тесты: modal visible when campaign active; accept → use case called; reject → use case called; notification payload → `notify` called (toasts in T-021)

### Примечания
> 2026-07-14: убран несуществующий `notificationStore` из спецификации. Sink = `OcpNotificationPresenter` → `useNotifications.notify` (как телефония). Zustand store для toast не планировать до внешних sink (host/SDK).
> T-021 (2026-07-14): toast wiring выполнен (`CallbackOcpNotificationPresenter` + `mapOcpNotificationToToastDescriptor`). E-09 — campaign modal.
> 2026-07-14: E-09 закрыт — `OcpCampaignEventModal` + `useOcpCampaignModal` в ReadyShell overlays.

---

## E-10 — Telephony ↔ OCP Bridge (полное подключение)

**Статус:** 🟢 Готово (2026-07-14) — logic + UI (`/ui` T-025)  
**Команда:** `/logic` → `/ui`  
**Зависимости:** E-04, E-05

### Цель
Завершить `OcpTelephonyBridgeService` с полным SIP↔OCP lifecycle, блокировкой кнопки звонка при RESERVED_TO_CALL и отклонением входящего с break-причиной.

### Направление реализации

**Подписка на Telephony Events:**  
Следуй точно паттерну `HeadsetIntegrationService.ts` — `DomainEventPublisher.subscribe(EventType, handler)`. Никакого прямого импорта из telephony domain в OCP bridge — только через event types. Если нужного события нет — добавить его в Telephony domain (это правильно).

**`OcpCallCorrelationMap`:**  
Простой `Map<CallId, string>` — private поле `OcpTelephonyBridgeService`. Не вытаскивать в отдельный класс — простота важнее. Заполняется при получении `entity: 'calls'` с `acallId`. Очищается при `CallEnded`/`CallFailed`.

**Нет `setInterval`:**  
В legacy был баг: `get_main_acallid` вызывался через `setInterval`, но `interval` всегда был `0` → WS flood. В новой реализации — только event-driven: `IncomingCallReceived → get_main_acallid`, затем ждём `entity: 'calls'` в ответ.

**Блокировка кнопки звонка:**  
Selector `selectIsCallButtonBlocked` из `operatorStatusProjection`. Подключить к `useDialpadShell`: `callDisabled = existingCallDisabled || isCallButtonBlocked`. Disabled reason — `'ocp.dialpad.reservedToCall'` (i18n key).

**Break reason на отклонение:**  
При OCP auth + наличии break reasons кнопка Reject открывает DropdownMenu («без перерыва» / «с указанием перерыва»). Выбор «с перерывом» → Dialog со списком причин → `RejectCall` + `ReservePostCallStatus({ targetStatus: 'break', reasonId })`. Без OCP — обычный reject.

### Чеклист

- [x] `OcpTelephonyBridgeService` — полная реализация:
  - Events → команды: IncomingCallReceived/OutgoingCallStarted/CallAnswered → `get_main_acallid`
  - CallEnded/CallFailed → `dlg_stop` (с acallId из OcpCallCorrelationMap)
  - `entity: 'calls'` → заполнить OcpCallCorrelationMap
  - Map очищается при CallEnded/CallFailed
  - Guard: `if (!isAuthenticated) return`
  - `dispose()` — все подписки
- [x] Selector `selectIsCallButtonBlocked` в `operatorStatusProjection`
- [x] Подключить `selectIsCallButtonBlocked` к `useDialpadShell` / `useSoftphoneCallActions` — **`/ui` T-025**
- [x] Disabled reason i18n key: `ocp.dialpad.reservedToCall` (5 локалей)
- [x] «Отклонить с причиной» в `IncomingCallSessionCard` / Overlay (опциональный пункт, только если OCP auth) — **`/ui` T-025**
- [x] i18n: `ocp.dialpad.reservedToCall`, `ocp.incomingCall.rejectWithBreakReason`, `ocp.incomingCall.rejectWithoutBreak`, `ocp.incomingCall.breakModal.*`
- [x] Integration test `OcpTelephonyBridge.integration.test.ts`:
  - `IncomingCallReceived` → `get_main_acallid` отправлен
  - `CallEnded` → `dlg_stop` с правильным acallId
  - Без OCP auth → команды не отправляются
  - `status === RESERVED_TO_CALL` → `selectIsCallButtonBlocked === true`

### Примечания
> 2026-07-14 `/logic`: bridge + selector + integration tests + i18n keys готовы.  
> 2026-07-14 `/ui` T-025: dialpad block + reject choice menu + break Dialog wired; E-10 closed.

---

## E-11 — SIP Авторизация из OCP `creds`

**Статус:** 🟢 Готово (2026-07-14)  
**Команда:** `/logic`  
**Зависимости:** E-04, E-05

### Цель
Авто-SIP-авторизация из учётных данных OCP (entity `creds`). Опциональна — управляется `ocpIntegration.autoSipAuth`.

### Направление реализации

**Паттерн:**  
Когда приходит `entity: 'creds'`, `OcpSipCredentialService` публикует Application-уровневый сигнал (через очередь или прямой вызов) → вызывает `AuthorizeSipAccountUseCase` с данными из creds. Это **не domain event** — это application orchestration.

**Безопасность:**  
Никогда не логировать SIP пароль. Передавать credentials только через параметры Use Case, не через domain events. Следуй `assertPersistedProfileJsonExcludesSecrets.ts` — проверить что creds не попадают в persistence.

**OCP domain ≠ SIP domain:**  
`entity:creds`.domain — hostname SIP/PBX. Он **не** должен перезаписывать `OcpSessionProjection.domain` (OCP proxy host) и **не** должен использоваться для `GET /proxy/authenticate` / reconnect. HTTP token всегда на `ocpIntegration.domain` / `profile.ocpDomain` (`resolveOcpProxyAuthenticateDomain`).

**Saved SIP profile after OCP sign-in:**  
Opt-in draft may temporarily key metadata by OCP login/host before creds. After SIP-ready, Application must persist saved-profile SIP `domain` / `server` / password from `entity:creds` (and keep `ocpDomain` as the separate OCP proxy field). Never leave OCP Domain written into SIP domain/server (ADR-AF-001 migration).

**Guard:**  
`autoSipAuth === true` AND `SIP не зарегистрирован` — только тогда вызывать `AuthorizeSipAccountUseCase`. Если SIP уже registered — `logger.debug`, не перерегистрировать.

### Чеклист

- [x] `OcpSipCredentialService` — полная реализация:
  - `entity: 'creds'` → if `autoSipAuth && !sipRegistered` → `AuthorizeSipAccountUseCase` + `RegisterAccountUseCase`
  - `entity: 'creds'` → if `autoSipAuth && sipRegistered` → `logger.debug` + skip
  - `entity: 'creds'` → if `!autoSipAuth` → skip
  - Пароль **не логировать**; для `source: "ocp"` пароль редactится в `SipCredentialsReceived`
  - `Result.err` от Use Case → `logger.error`, не throw
- [x] Тесты `OcpSipCredentialService.test.ts`:
  - creds + autoSipAuth=true + unregistered → Use Case вызван
  - creds + autoSipAuth=false → Use Case не вызван
  - creds + registered → Use Case не вызван

### Примечания
> 2026-07-14: wired via `OcpIntegrationComposition` + Facade getters (`ocpAutoSipAuthEnabled`, `sipSessionRegistered`). After authorize success also calls `RegisterAccountUseCase` so auto-auth actually registers SIP.
> 2026-07-17: fixed reconnect bug — `creds` no longer overwrote OCP session domain with SIP host; fresh-token reconnect uses `resolveOcpProxyAuthenticateDomain`.
> 2026-07-17: fixed saved-profile bug — after OCP sign-in, SIP domain/server/password persist from `entity:creds` via `persistOcpDerivedSipArtifacts` (provisional OCP-host draft migrated/deleted).

---

## E-12 — External OCP Command Surface (P12 prep)


**Статус:** 🟢 Done (2026-07-14; Softphone global removed same day)  
**Команда:** `/logic`  
**Зависимости:** E-04, E-05

### Цель
Typed external OCP command surface for future browser-tab integration. **Не** порт legacy `window.Softphone` / `authenticateOCPModule` (это был embed widget в старой CRM). В Axatalk вкладка браузера будет ходить через `ExternalClientGateway` + `ExternalCommandRouter` (WS → main) — реализация gateway позже.

### Направление реализации

- `src/shared/host-api/OcpHostApiContract.ts` — channel ids + payload parsers
- `AccountBootstrapFacade.authenticateOcpFromHost` / `changeOcpStatusFromHost` / `getOcpConnectionState`
- Status changes use `callType: 'external'`
- Нет `window.Softphone`, нет DOM CustomEvent host bridge

**Для External SDK / Gateway (задел):**  
Future router вызывает те же Facade methods; Use Cases уже принимают `callType: 'external' | 'sdk'`.

### Файловая структура

```
src/shared/host-api/
└── OcpHostApiContract.ts

src/application/facades/AccountBootstrapFacade.ts  — external OCP command methods
```

### Чеклист

- [x] `OcpHostApiContract.ts`: channels `ocp:authenticate` / ready / break / get-session-state + parsers
- [x] Facade host methods with `callType: 'external'`
- [x] `window.Softphone` / Softphone host adapter — **removed** (not applicable to Electron product)
- [x] Tests: contract + facade host methods

### Примечания
> Legacy jssip-phone used `window.Softphone` for script-embed widgets. Axatalk replaces that with ExternalClientGateway (future). E-12 only prepares contract + Facade entry points.

---

## E-13 — i18n, Integration Tests, WU Gate

**Статус:** 🟢 Готово (2026-07-14, `/logic`)
**Команда:** `/preflight` → `/review`
**Зависимости:** все предыдущие этапы

### Цель
Финальная проверка: i18n, integration тесты, lint, registry, smoke checklist.

### Направление реализации

**`/preflight` команда** запускает: `npm run lint`, `npm run typecheck`, `npm run i18n:check`, `npm run registry:check`, `npm run test`. Все должны быть PASS.

**Integration test паттерн:**
Следуй `src/application/integration/SipRecoveryOrchestration.integration.test.ts` — test с реальными Use Cases + MockGateway. Тест описывает полный lifecycle: connect → auth → changeStatus → dlgStop → logout.

### Чеклист

#### i18n
- [x] `npm run i18n:check` — PASS
- [x] Каталоги ru, en, fr, de, bg — все `ocp.*` и `settings.integrations.*` ключи добавлены

#### Integration Tests
- [x] `OcpFullFlow.integration.test.ts`:
  - Connect → auth (simulateMessage users) → `operatorStatusProjection` обновлён
  - ChangeStatus READY→BREAK → `change_status_to_break` в MockOcpGateway.sentCommands
  - `CallEndedEvent` → `dlg_stop` отправлен (через bridge)
  - `LogoutOperatorUseCase` → `change_status_to_logout` + disconnect
  - Реконнект: 6 попыток → `state = 'failed'`
  - SESSION_EXIST → no reconnect

#### Lint + Typecheck
- [x] `npm run lint` — PASS (нет `any`, `@ts-ignore`, `@deprecated`)
- [x] `npm run typecheck` — PASS
- [x] `npm run registry:check` — PASS
- [x] 0 regression в `npm run test`

#### Feature Registry
- [x] F-028 → `implemented` в `Feature-Registry.md`
- [x] LF-018, LF-019, LF-041–LF-049 → реализованы через F-028 в `Legacy-Feature-Coverage.md`
- [x] `STATUS.md` обновлён

#### Manual Smoke (опциональный)
- [x] `ocp-integration/OCP-Smoke-Checklist.md` создан:
  - SM-1: Settings → Integrations → OCP → connect → статус READY в хедере
  - SM-2: READY → BREAK → точка оранжевая
  - SM-3: Входящий звонок → `get_main_acallid` в WS logs
  - SM-4: Завершение → `dlg_stop` в WS logs
  - SM-5: Logout с причиной → `change_status_to_logout`
  - SM-6: WS disconnect 10с → баннер → реконнект
  - SM-7: SESSION_EXIST → блокирующий экран
  - SM-8: External command `changeOcpStatusFromHost({ targetStatus: 'break', reasonId: 7 })` (future WS gateway) → статус сменился

### Примечания
> E-13 завершён 2026-07-14 (`/logic`). `OcpFullFlow.integration.test.ts` покрывает lifecycle + WS reconnect/SESSION_EXIST. i18n parity already green from E-06…E-10. F-028 → `implemented`. Следующий шаг: `/preflight` → `/review`.

---

## EXT — Задел на будущее: External SDK Gateway

> **Статус:** 📋 Проектирование (не реализуется сейчас)  
> **Читать агентам на этапах E-01..E-13 чтобы писать код с учётом будущего.**

### Концепция

Браузерные вкладки (CRM, оператор-портал, любая web-страница) смогут подключаться к работающему Electron-приложению через **local WebSocket** и дёргать методы напрямую: сменить статус, получить текущее состояние оператора, показать/скрыть окно телефона.

Пользователь напишет кастомный **SDK** (`ocpPhone.js` / npm-пакет), который:
1. Подключается к `ws://localhost:{PORT}` — локальный WS-сервер Electron-приложения
2. Аутентифицируется токеном (short-lived JWT или shared secret из настроек)
3. Подписывается на push-события: `statusChanged`, `callStarted`, `callEnded`
4. Вызывает методы: `changeStatus`, `logout`, `login`, `show`, `hide`

```
┌─────────────────────────────────────────┐
│           Browser Tab (CRM)             │
│  ┌──────────────────────────────────┐   │
│  │  SDK (ocpPhone.js)               │   │
│  │  ws://localhost:3051             │   │
│  └──────────────────┬───────────────┘   │
└─────────────────────┼───────────────────┘
                      │ WebSocket
┌─────────────────────▼───────────────────┐
│         Electron Main Process           │
│                                         │
│  ┌────────────────────────────────┐     │
│  │  LocalWsServerAdapter          │     │
│  │  (реализует ExternalClientGateway)│  │
│  └──────────────┬─────────────────┘     │
│                 │ typed commands        │
│  ┌──────────────▼─────────────────┐     │
│  │  ExternalCommandRouter         │     │
│  │  (маршрутизирует команды)      │     │
│  └──────────────┬─────────────────┘     │
│                 │                       │
│  ┌──────────────▼─────────────────┐     │
│  │  AccountBootstrapFacade        │     │  ← единственная точка входа
│  │  (те же Use Cases)             │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### Что необходимо сделать СЕЙЧАС (в E-01..E-13) чтобы потом не было костылей

#### 1. Use Cases — source-agnostic

Все Use Cases в E-04 **не знают** откуда пришёл запрос — из renderer UI, external tab (`ExternalCommandRouter`), или SDK. Единственный индикатор источника — `callType: 'internal' | 'external' | 'sdk'`. Use Case передаёт его в OcpCommand для аудит-трейла.

✅ **Что нужно сейчас:** `callType: 'internal' | 'external' | 'sdk'` — заложить в тип `OcpCommand` (сделано в E-02).  
❌ **Что НЕ делать:** не привязывать Use Cases к renderer-специфичным типам (React, Zustand state).

#### 2. AccountBootstrapFacade — единственная точка входа

Facade в E-06 должен быть вызываем **не только из renderer через preload IPC**, но и из main process напрямую (без IPC round-trip). Это значит: Facade — это класс в Application слое, не tied к renderer.

✅ **Что нужно сейчас:** `AccountBootstrapFacade` уже живёт в Application (`src/application/facades/`). Все методы OCP (`connectOcp`, `disconnectOcp`, `changeOperatorStatus`, `logoutOperator`) добавлять туда — не в renderer hooks.  
❌ **Что НЕ делать:** не создавать renderer-only helpers с бизнес-логикой OCP.

#### 3. Projection state — JSON-serializable

Zustand projections из E-05 — state должен быть 100% сериализуемым. В будущем push к SDK клиентам:

```typescript
// В будущем ExternalCommandRouter будет делать так:
const snapshot = {
  operatorStatus: operatorStatusProjection.getState(),
  ocpSession: ocpSessionProjection.getState(),
};
sdkClient.send(JSON.stringify({ type: 'state:snapshot', payload: snapshot }));
```

✅ **Что нужно сейчас:** только примитивы, массивы и plain objects в projection state. Никаких `Date` объектов (только `number` timestamp). Никаких `Map`/`Set` в store (только plain object или array).

#### 4. `ExternalClientGateway` — порт для будущего (не реализовывать сейчас, но не блокировать)

Когда придёт время реализовать SDK server, понадобится:

```typescript
// src/ports/integration/ExternalClientGateway.ts  (создать позже)
interface ExternalClientGateway {
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  broadcast(event: ExternalSdkEvent): void;
  onCommand(handler: (cmd: ExternalSdkCommand, reply: ReplyFn) => void): Unsubscribe;
}

// src/domain/integration/ocp/ExternalSdkEvent.ts  (создать позже)
type ExternalSdkEvent =
  | { type: 'ocp:statusChanged'; payload: OperatorStatusSnapshot }
  | { type: 'ocp:sessionState'; payload: OcpConnectionState }
  | { type: 'call:started'; payload: CallSnapshot }
  | { type: 'call:ended'; payload: { callId: string } }
  | { type: 'window:visibility'; payload: { visible: boolean } };

// src/domain/integration/ocp/ExternalSdkCommand.ts  (создать позже)
type ExternalSdkCommand =
  | { type: 'ocp:changeStatus'; payload: { targetStatus: 'ready' | 'break'; reasonId: number } }
  | { type: 'ocp:logout'; payload: { reasonId: number } }
  | { type: 'ocp:login'; payload: { domain: string; token: string } }
  | { type: 'window:show' }
  | { type: 'window:hide' };
```

✅ **Что нужно сейчас:**
- Не создавать этот файл — но проектировать OCP use cases так, чтобы их можно было вызвать из `ExternalCommandRouter` в будущем без рефакторинга
- `ExternalSdkEvent` — это сериализованная версия Projection state + Call events. Projection state уже должен быть serializable (п. 3)

#### 5. Settings → Integrations — расширяемость

Раздел «Integrations» в UI (E-06) должен быть extensible: не одна hardcoded OCP карточка, а список карточек. Когда придёт время добавить конфигурацию SDK-сервера (порт, auth token, список разрешённых origins) — это будет ещё одна карточка в `SettingsIntegrationsPanel`.

✅ **Что нужно сейчас:** `SettingsIntegrationsPanel` — это `<section>` с `<OcpModuleSettingsCard />`. В будущем добавится `<SdkServerSettingsCard />`. Не делать панель монолитной.

#### 6. Аутентификация SDK-клиентов

В будущем SDK-клиент (браузерная вкладка) должен аутентифицироваться прежде чем получит доступ к методам. Механизм: shared secret или short-lived token, который генерируется в Electron и отображается в Settings → Integrations → SDK Server.

✅ **Что нужно сейчас:** `SecretStoragePort` уже есть и используется для OCP токена. Когда придёт время — та же инфраструктура будет использована для SDK auth token.

### SDK Wire Protocol (для справки — реализовывать позже)

```json
// Browser SDK → Electron (команды)
{ "type": "ocp:changeStatus", "payload": { "targetStatus": "break", "reasonId": 7 }, "requestId": "req-123" }
{ "type": "ocp:logout", "payload": { "reasonId": 9 }, "requestId": "req-124" }
{ "type": "window:show", "requestId": "req-125" }

// Electron → Browser SDK (ответы)
{ "type": "reply", "requestId": "req-123", "ok": true }
{ "type": "reply", "requestId": "req-124", "ok": false, "error": "transition_not_allowed" }

// Electron → Browser SDK (push события)
{ "type": "ocp:statusChanged", "payload": { "status": 7, "reasonId": 3, "since": 1720877845123 } }
{ "type": "call:started", "payload": { "callId": "call-abc", "direction": "incoming", "number": "+79001234567" } }
{ "type": "ocp:sessionState", "payload": "authenticated" }
```

### Новые типы в Settings → Integrations (добавить позже)

```typescript
// UserSettings v8 (будущее):
type SdkServerSettings = {
  readonly enabled: boolean;
  readonly port: number;                      // default: 3051
  readonly allowedOrigins: readonly string[]; // ['http://crm.example.com']
};
```

### Что НЕ нужно делать в E-01..E-13 прямо сейчас

- ❌ Не создавать `ExternalClientGateway` (только знать что он будет)
- ❌ Не создавать local WS-сервер
- ❌ Не добавлять SDK auth в Settings
- ❌ Не реализовывать `ExternalCommandRouter`
- ❌ Не добавлять `callType: 'sdk'` в реальные вызовы (только в тип)

Всё это придёт в отдельной итерации. Задача сейчас — написать код так, чтобы эта итерация **не потребовала переписывания** Use Cases, Facade и Projections.

---

## Глобальные зависимости и порядок выполнения

```
E-01 (Domain)
  └─ E-02 (Port + Protocol)
       ├─ E-03 (WS Adapter)
       └─ E-04 (Use Cases)
            └─ E-05 (Projections + Bridges)
                 ├─ E-06 (Settings UI)       ← параллельно после E-05
                 ├─ E-07 (Status Selector)   ← параллельно после E-05
                 ├─ E-08 (Logout Modal)      ← параллельно после E-07
                 ├─ E-09 (Campaign UI)       ← параллельно после E-05
                 ├─ E-10 (Telephony Bridge)  ← параллельно после E-05
                 ├─ E-11 (SIP Creds)         ← параллельно после E-05
                 └─ E-12 (Host-Page API)     ← параллельно после E-04
                          └─ E-13 (Gate)     ← все предыдущие завершены
```

E-06, E-07, E-08, E-09, E-10, E-11, E-12 могут выполняться **параллельно** после завершения E-05.

---

## Критические запреты (для всех агентов)

1. **Никакой бизнес-логики OCP в React-компонентах** — только hooks → Use Cases через facade.
2. **Никакого `window.ws` глобала** — только typed `OcpGateway` порт.
3. **Никакого `window.Softphone`** — external tabs → `ExternalClientGateway` + `ExternalCommandRouter` (будущее).
4. **Нет `setInterval` для `get_main_acallid`** — только event-driven через Domain Events.
5. **Нет прямой зависимости OCP → Telephony domain** — только через `DomainEventPublisher`.
6. **Нет DOM `CustomEvent`** — только `DomainEventPublisher`.
7. **Logout идемпотентен** — `connectionState = 'sessionClosed'` блокирует реконнект навсегда.
8. **SIP пароли не логировать** — `OperatorCredentialsReceived` не содержит пароль.
9. **`npm run test` — 0 regression** перед закрытием каждого этапа.
10. **Нет `any`, `@ts-ignore`, `as unknown as`** в затронутом коде.
11. **Projection state — только serializable значения** — `number` timestamps, plain arrays/objects, никаких `Date`, `Map`, `Set` в store state. Это обязательное условие для будущего External SDK.
12. **Use Cases не знают об источнике вызова** — только `callType` в параметрах. Никаких renderer-specific типов в Use Cases.

---

## Audit remediation notes (2026-07-14)

Closed post-E-13 audit gaps **without** implementing ExternalClientGateway:

| Gap | Fix |
| --- | --- |
| LF-049 `entity: terminate` ignored | `OcpSessionLifecycleService` → `disconnect("terminate")` → `sessionClosed` + Domain Events + SIP cascade |
| Renderer called `getOcpIntegration().*.execute` | Facade methods only; `getOcpIntegration` marked `@internal` |
| Domain event factories unused | Published from lifecycle / Use Cases on real transitions |
| `instanceof CallbackOcpNotificationPresenter` | Port optional `setHandler` |
| `autoConnect` unused | `AccountBootstrapFacade.maybeAutoConnectOcp` after `initialize` |
| Host logout missing | `OcpHostApiContract` `ocp:logout` + `logoutOcpFromHost` |

**Still future (EXT):** ExternalClientGateway, ExternalCommandRouter, local WS in main — not implemented.

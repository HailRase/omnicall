# OmniCall Kit — руководство для разработчиков

Канонический русскоязычный гайд для интеграторов CRM: один файл — от установки до продакшена. Английские страницы в этой папке и [`etc/api/sdk.api.md`](../../etc/api/sdk.api.md) — источники правды по символам API. Если формулировка здесь расходится с API report — побеждает report.

## Статус пакета

Пакет `@softomnitel/omnicall-kit` — тонкий браузерный клиент к локальному gateway OmniCall Desktop. SIP, OCP и Call Engine остаются на desktop; в браузере нет второго softphone и нет SIP-стека.

| Поле | Значение |
| --- | --- |
| npm | `@softomnitel/omnicall-kit` (+ транзитивно `@softomnitel/omnicall-protocol`) |
| Stable | `0.1.0` (`latest`) |
| RC | `0.1.0-rc.0` (`rc`) |
| Feature Registry | F-011 — **implemented** (DI-10 closed) |
| Браузеры | Chromium / Edge (Chromium). Firefox/Safari — не заявлены |
| Модуль | ESM only, Node `>=20.19.0` |
| SDK **не** делает | SIP/OCP auth secrets, telephony FSM, `window.Softphone`, fetch-fallback к desktop HTTP |

---

## Кому и зачем

Аудитория: frontend/CRM-разработчики (JS/TS), которые встраивают SDK в HTTPS-страницу CRM при уже установленном OmniCall Desktop.

Цель интеграции:

1. Pairing + PoP-сессия к loopback WebSocket gateway.
2. UI CRM = redacted **snapshot** + публичные **events**.
3. Мутации звонков / оператора / окна / logout / activate — только через namespaced API с `expectedRevision` и server-issued capabilities.

Не цель: зеркалировать Domain Events desktop, хранить секреты в браузере, изобретать второй Call Engine.

---

## Быстрый старт (5 минут)

Конструктор **без** сетевых side effects. Сеть начинается только на `connect()`.

<details>
<summary>Пример: минимальный connect → ready → snapshot</summary>

```ts
import {
  createOmniCallClient,
  createIndexedDbPopKeyStore,
  createMemoryPopKeyStore,
  isOmniCallClientError
} from '@softomnitel/omnicall-kit';

const keyStore =
  typeof indexedDB !== 'undefined'
    ? createIndexedDbPopKeyStore({ installId: 'crm-install-1' })
    : createMemoryPopKeyStore();

const client = createOmniCallClient({
  url: 'ws://127.0.0.1:17341/omnicall/v1/ws',
  origin: 'https://crm.example', // exact Origin
  application: { name: 'my-crm', version: '1.2.0' },
  sdkVersion: '0.1.0',
  requestedProfile: 'call_controller',
  requestedCapabilities: [
    'session.read.redacted',
    'window.show',
    'call.originate',
    'call.control',
    'session.logout',
    'operator.status.write'
  ],
  keyStore
  // transportFactory / scheduler / jitter опущены → browser defaults
});

client.onPairingRequired((info) => {
  // Пользователь должен Allow Origin (TOFU) и Approve pairing в OmniCall
  void info.origin;
  void info.requestedProfile;
});

client.onStateChange((state) => {
  void state;
});

await client.connect();
await client.waitUntil((s) => s === 'ready');

const snapshot = await client.getSnapshot();
const revision = snapshot.revision;

client.subscribe('call:incoming', (event) => {
  void event.type; // не логируйте полный payload в проде
});

void revision;
void isOmniCallClientError;
```

</details>

<details>
<summary>Почему так / на что смотреть</summary>

- PoP: IndexedDB в браузере, memory в тестах — никогда Web Storage.
- Privileged caps (`account.activate`, `window.hide`) **не** запрашивайте на pairing — SDK strips.
- После `ready` берите revision из snapshot / `getRevision()` перед мутациями.
- Runnable (fake peer): [`examples/crm-pairing-lite/`](../../examples/crm-pairing-lite/).

</details>

Краткая лестница состояний:

| Состояние | UI хоста |
| --- | --- |
| `idle` | Кнопка Connect |
| `connecting` / `handshaking` / `authenticating` | Spinner |
| `pairing_required` | «Подтвердите в OmniCall» |
| `ready` | Включить product UI |
| `reconnecting` | Non-blocking banner |
| `revoked` / `incompatible` / `failed` / `closed` | Очистить сессию; re-pair при необходимости |

EN: [pairing-quick-start.md](./pairing-quick-start.md).

---

## Модель системы (как это устроено)

```text
CRM (HTTPS)
  → @softomnitel/omnicall-kit (OmniCallClient)
  → TransportPort (createBrowserWebSocketTransport)
  → ws://127.0.0.1:…/omnicall/v1/ws
  → OmniCall Desktop gateway (Electron main)
  → Application / Call Engine / SIP / OCP
```

| Роль | Владелец правды |
| --- | --- |
| Telephony / operator FSM / credentials | Desktop |
| Session auth (pairing, PoP, capabilities) | Desktop + SDK auth orchestrator |
| UI CRM state | Snapshot + public events (клиент — thin reader/writer) |
| Transport bytes | Тонкий `TransportPort` — без JSON parse и без reconnect |

Discovery / Local Network Access (HTTPS → loopback): см. [installation.md](./installation.md) и [transport.md](./transport.md). Ошибки LNA: `local_network_permission_required` / `_denied`.

Официальный транспорт: `createBrowserWebSocketTransport`. Не парсите JSON сами. Defaults: `createBrowserScheduler` / `createBrowserJitterSource`. В unit-тестах inject FakeTransport + fake scheduler/jitter.

Shared desk (ADR-0021): любой авторизованный paired-клиент с grant в Origin matrix может управлять тем же call state. Ownership на wire — информационный; transfer/conference на SDK **не** экспонированы.

---

## Установка и окружение

```bash
npm install @softomnitel/omnicall-kit
# pin: npm install @softomnitel/omnicall-kit@0.1.0
# RC:  npm install @softomnitel/omnicall-kit@rc
```

| Требование | Значение |
| --- | --- |
| Node (tooling) | `>=20.19.0` |
| Module | ESM only |
| Web Crypto | ECDSA P-256, non-extractable (PoP) |
| IndexedDB | Durable PoP в браузере |
| Desktop | OmniCall с включённым SDK gateway |

Импорты для CRM — из одного пакета:

```ts
import {
  createOmniCallClient,
  createIndexedDbPopKeyStore,
  isOmniCallClientError,
  type OmniCallClient,
  type OmniCallEventOf,
  type SnapshotMessage,
  type CapabilityId
} from '@softomnitel/omnicall-kit';
```

`@softomnitel/omnicall-protocol` нужен только для Zod schemas / fixtures — не для day-to-day CRM. EN: [typescript.md](./typescript.md), [installation.md](./installation.md).

---

## Жизненный цикл клиента и состояния

### Создание

`createOmniCallClient(options)` / `createAuthClient(options)` — `OmniCallClientOptions` = `AuthClientOptions`.

| Опция | Назначение |
| --- | --- |
| `url` | Loopback WS endpoint |
| `origin` | Exact Origin страницы CRM |
| `application` | `{ name, version }` |
| `sdkVersion` | Версия SDK-строки на wire |
| `requestedProfile` | `presentation` \| `operator` \| `call_controller` |
| `requestedCapabilities?` | Non-privileged only; sanitize + strip privileged |
| `keyStore` | `PopKeyStore` (IndexedDB / memory) |
| `transportFactory?` | Default: browser WS |
| `scheduler?` / `jitter?` | Default: browser; inject в тестах |
| `reconnect?` | `ReconnectPolicy` |
| `heartbeat?` | `HeartbeatPolicy` |
| `diagnostics?` | Redaction-safe sink |
| `defaultRequestTimeoutMs?` | Таймаут обычных команд |

`createAuthClient` — только lifecycle/auth, без `calls` / `operator` / `account` / `window`.

### Состояния `CONNECTION_STATES`

| State | Смысл | Действие хоста |
| --- | --- | --- |
| `idle` | Сконструирован | Показать Connect |
| `connecting` | Открытие транспорта | Spinner |
| `handshaking` | Hello / protocol | Spinner |
| `pairing_required` | Нужен Approve в desktop | Инструкция оператору |
| `authenticating` | PoP challenge | Spinner |
| `ready` | Сессия + snapshot path | Product UI |
| `reconnecting` | Bounded retry | Banner; не replay мутаций |
| `incompatible` | Protocol mismatch | Upgrade; стоп |
| `revoked` | Сессия отозвана | Clear + re-pair |
| `failed` | Невосстановимый сбой | Показать ошибку (`getConnectError`) |
| `closed` | Закрыто | Connect заново при необходимости |

Типичный happy path: `idle` → `connecting` → `handshaking` → (`pairing_required` →) `authenticating` → `ready`.

### Подписки и методы lifecycle

| API | Назначение |
| --- | --- |
| `onStateChange(listener)` | Смена `ConnectionState`; возвращает unsubscribe |
| `onPairingRequired(listener)` | Origin/profile/clientId для UX pairing |
| `subscribe(type, listener)` | Публичные product events (`PUBLIC_EVENT_TYPES`) |
| `connect()` | Старт сети |
| `disconnect()` | Закрыть WS; **не** hangup/logout/activate/hide |
| `waitUntil(predicate, timeoutMs?)` | Дождаться состояния |
| `getState()` / `getSession()` / `getGrantedCapabilities()` | Интроспекция |
| `getConnectError()` | Последняя ошибка connect |
| `getSnapshot()` / `getCachedSnapshot()` / `getRevision()` | Snapshot / revision |
| `preauthDropCount()` | Диагностика preauth drops |

<details>
<summary>Пример: waitUntil ready + обработка connect error</summary>

```ts
client.onStateChange((state) => {
  if (state === 'failed') {
    const err = client.getConnectError();
    void err?.code;
  }
});

try {
  await client.connect();
  await client.waitUntil((s) => s === 'ready', 60_000);
} catch (error: unknown) {
  if (isOmniCallClientError(error)) {
    void error.code;
  }
  throw error;
}
```

</details>

---

## Pairing, Origin и capabilities

### Profiles

| Profile | Default caps (non-privileged) |
| --- | --- |
| `presentation` | `session.read.redacted`, `window.show` |
| `operator` | presentation + `operator.status.write`, `operator.campaign.read`, `ocp.acd_context.read`, `session.logout` |
| `call_controller` | operator + `call.originate`, `call.control`, granular `call.answer\|reject\|hangup\|hold\|mute` |

Источник: protocol `DEFAULT_CAPABILITY_PROFILES`. `account.activate` и `window.hide` **никогда** не в defaults.

### Origin

- Exact match строки Origin — без wildcard / substring.
- Первый контакт: TOFU Allow/Deny в OmniCall (ADR-0018).
- Blacklist → `origin_blocked` (сокет не поднимается) — Unblock в Settings → OmniCall Kit.
- Deny → `forbidden` + `origin_denied`, затем close.

### Capabilities: request vs grant

| Правило | Деталь |
| --- | --- |
| Client request | Только non-privileged; SDK `sanitizeRequestedCapabilities` |
| Strip always | `account.activate`, `window.hide` |
| Desktop grant | Intersection: pairing session ∩ per-Origin matrix |
| Host видит | Только `getGrantedCapabilities()` |
| Privileged elevation | Только Settings → Origin matrix (оператор) |

| Capability | Privileged? | Типичный метод |
| --- | --- | --- |
| `session.read.redacted` | Нет | snapshot / events |
| `window.show` | Нет | `window.show` |
| `window.hide` | **Да** | `window.hide` |
| `call.originate` | Нет | `calls.originate` |
| `call.control` | Нет | umbrella + DTMF |
| `call.answer` / `reject` / `hangup` / `hold` / `mute` | Нет | соответствующие методы |
| `operator.status.write` | Нет | `changeStatus` / `finishAppeal` |
| `operator.campaign.read` | Нет | campaign events + snapshot |
| `ocp.acd_context.read` | Нет | `call:acd-context` |
| `session.logout` | Нет | `account.logout` |
| `account.activate` | **Да** | `account.activateProfile` |

Revoke / matrix shrink mid-session → `forbidden` / state `revoked`. Хост: очистить UI, предложить re-pair / открыть Settings.

EN: [capabilities.md](./capabilities.md), [pairing-quick-start.md](./pairing-quick-start.md).

---

## Snapshot и revision

Snapshot — источник UI state после `ready` и после каждого успешного reconnect.

| API | Смысл |
| --- | --- |
| `getSnapshot()` | Свежий snapshot с desktop |
| `getCachedSnapshot()` | Последний кэш или `undefined` |
| `getRevision()` | Текущий cached revision или `undefined` |
| Mutation `expectedRevision` | Обязателен; иначе риск `stale_state` |

Правила:

1. Перед мутацией: `client.getRevision() ?? (await client.getSnapshot()).revision`.
2. После успеха: используйте `revision` из результата / обновите snapshot.
3. После `stale_state`: новый snapshot; **не** слепой retry со старым числом.
4. Events **не** патчат snapshot cache — при gap SDK сам тянет snapshot.
5. Desktop coarse-advances revision на смене coarse operator status, reasonId, connected, reservation booking — не на каждом talking↔hold внутри `unknown`.

<details>
<summary>Пример: безопасная мутация с revision</summary>

```ts
async function withFreshRevision<T>(
  client: {
    getRevision: () => number | undefined;
    getSnapshot: () => Promise<{ revision: number }>;
  },
  run: (expectedRevision: number) => Promise<T>
): Promise<T> {
  const expectedRevision =
    client.getRevision() ?? (await client.getSnapshot()).revision;
  return run(expectedRevision);
}
```

</details>

---

## API (namespaces)

Публичный клиент: `OmniCallClient`. Ниже — только символы из API report.

### `client.calls`

Все мутации требуют `expectedRevision`. Результат: `{ callId, revision }`.

| Метод | Capability | Типичные ошибки |
| --- | --- | --- |
| `originate({ destination, expectedRevision })` | `call.originate` | `forbidden`, `not_ready`, `stale_state`, `conflict`, `operation_failed` (`sip_not_registered`) |
| `answer` / `reject` / `hangup` | `call.answer` / `reject` / `hangup` или `call.control` | `forbidden`, `not_found`, `stale_state`, `conflict` |
| `hold` / `resume` | `call.hold` или `call.control` | то же |
| `mute` / `unmute` | `call.mute` или `call.control` | то же |
| `sendDtmf({ callId, digits, expectedRevision })` | **только** `call.control` | `forbidden`, `stale_state`, `not_found` |

Shared desk: см. ADR-0021 — ownership не блокирует control. Transfer/conference на SDK нет.

<details>
<summary>Пример: originate с обработкой ошибок</summary>

```ts
import {
  isOmniCallClientError,
  isConflictError,
  isOperationFailedError,
  readOperationFailedDetails
} from '@softomnitel/omnicall-kit';

async function originateSafe(
  client: OmniCallClient,
  destination: string
): Promise<void> {
  const revision =
    client.getRevision() ?? (await client.getSnapshot()).revision;
  try {
    await client.calls.originate({ destination, expectedRevision: revision });
  } catch (error: unknown) {
    if (isOperationFailedError(error)) {
      const details = readOperationFailedDetails(error.details);
      if (details?.failure_kind === 'sip_not_registered') {
        return; // preflight deny — события call:failed не будет
      }
    }
    if (isConflictError(error)) return;
    if (!isOmniCallClientError(error)) throw error;
    if (error.code === 'stale_state') {
      await client.getSnapshot();
    }
  }
}
```

</details>

### `client.window`

| Метод | Capability / заметка |
| --- | --- |
| `show()` | `window.show` — focus softphone |
| `hide({ expectedRevision })` | Privileged `window.hide`; busy telephony → `conflict`; recovery: tray Show / `show()` |
| `getState()` | `{ visible, revision }` |

`hide` не запрашивайте на pairing. Grant: Settings → Origin matrix.

### `client.account`

| Метод | Capability | Заметки |
| --- | --- | --- |
| `logout({ reasonId?, expectedRevision })` | `session.logout` | Single-shot; может `interaction_required` |
| `activateProfile({ login, expectedRevision, mode? })` | **`account.activate` (server-granted)** | `mode?: 'sip_only' \| 'ocp'`; никогда passwords |

Константы таймаутов activate (re-export из protocol):

| Константа | Смысл |
| --- | --- |
| `SDK_ACTIVATE_CONSENT_TTL_MS` | Consent modal (~120 s) |
| `SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS` | SIP-only auth budget |
| `SDK_ACTIVATE_OCP_AUTH_BUDGET_MS` | OCP auth budget |
| `SDK_ACTIVATE_CLIENT_TIMEOUT_MS` | Client wait ceiling (~420 s) |

EN: [saved-profile-activation.md](./saved-profile-activation.md), [logout-workflow.md](./logout-workflow.md).

<details>
<summary>Пример: activate только после feature-detect</summary>

```ts
if (!client.getGrantedCapabilities().includes('account.activate')) {
  // Попросите оператора включить account.activate для Origin
  return;
}

await client.account.activateProfile({
  login: 'agent42',
  expectedRevision,
  mode: 'sip_only'
});
```

</details>

### `client.operator`

| Метод | Capability | Результат |
| --- | --- | --- |
| `getReasons()` | session read path | `{ reasons, revision }` |
| `changeStatus({ target, reasonId?, expectedRevision })` | `operator.status.write` | `kind: 'applied' \| 'reserved'` |
| `finishAppeal({ expectedRevision })` | `operator.status.write` | только при `post_call_processing` |

**Не** изобретайте отдельный reserve API. Всегда `changeStatus`; читайте `kind`. Booking виден в snapshot/event: `reservedTarget` / `reservedReasonId`.

| Ситуация | `changeStatus` |
| --- | --- |
| Idle Ready/Break | `applied` |
| Busy / PCP | `reserved` (chip не сразу Break/Ready) |

EN: [operator-status-reservation.md](./operator-status-reservation.md).

### Logout (single-shot)

Нет prepare/confirm handshake и нет `logoutToken`.

1. При необходимости: `getReasons()` → `kind === 'logout'`.
2. `account.logout({ expectedRevision })` или с `reasonId`.
3. При `interaction_required` — modal с reasons; повторный `logout` со свежим revision.
4. Cancel = просто не вызывать снова. `disconnect()` ≠ logout.

<details>
<summary>Пример: logout с interaction_required</summary>

```ts
import {
  isOmniCallClientError,
  isInteractionRequiredError,
  readInteractionRequiredDetails
} from '@softomnitel/omnicall-kit';

const { reasons } = await client.operator.getReasons();
const logoutReasons = reasons.filter((r) => r.kind === 'logout');

try {
  await client.account.logout({ expectedRevision });
} catch (error: unknown) {
  if (!isInteractionRequiredError(error)) {
    if (isOmniCallClientError(error)) throw error;
    throw error;
  }
  const details = readInteractionRequiredDetails(error.details);
  const reasonId = details?.reasons[0]?.id ?? logoutReasons[0]?.id;
  if (reasonId === undefined) return;
  const next =
    client.getRevision() ?? (await client.getSnapshot()).revision;
  await client.account.logout({ reasonId, expectedRevision: next });
}
```

</details>

Полный перечень публичных символов (77): [api-reference.md](./api-reference.md).

---

## События

Подписка только на имена из `PUBLIC_EVENT_TYPES`. Domain Event names desktop — запрещены.

| Событие | Зачем хосту | Snapshot-участок |
| --- | --- | --- |
| `call:incoming` | Answer/reject UI; optional `queueLabel` | `sections.calls` |
| `call:outgoing` / `call:ringing` / `call:answered` | Dial/ring/active | `sections.calls` |
| `call:ended` / `call:failed` | Tear down / toast | `sections.calls` |
| `call:held` / `call:resumed` | Hold | `sections.calls` |
| `call:muted` / `call:unmuted` | Mute | `sections.calls` |
| `call:acd-context` | OCP MainCallIDInfo (`ocp.acd_context.read`) | `calls[].acdContext` |
| `registration:changed` | SIP badge | registration section |
| `account:session-activated` / `account:session-ended` | Signed-in projection | account |
| `operator:session-changed` | `connected` | `sections.operator` |
| `operator:status-changed` | Coarse status + booking fields | `sections.operator` |
| `operator:campaign-offered` / `cleared` | Campaign UI (`operator.campaign.read`) | `operator.campaign` |
| `window:visibility-changed` | Softphone visibility | window |
| `sdk:server-shutdown` | Desktop stopping — wait/reconnect | — |

Redaction: телефоны маскированы; никаких OCP wire objects в логах. Sequence gap → SDK делает fresh `getSnapshot()`.

Не через `subscribe` (by design): `sdk:permission-changed` → перечитайте `getGrantedCapabilities()`; `sdk:revoked` → state `revoked`.

Типизация: `OmniCallEventOf<'call:incoming'>`. EN: [events.md](./events.md), [typescript.md](./typescript.md).

<details>
<summary>Пример: subscribe + campaign recovery</summary>

```ts
const stop = client.subscribe('operator:status-changed', (event) => {
  void event.payload.status;
  void event.payload.reservedTarget;
});

client.subscribe('call:acd-context', (event) => {
  void event.payload.acallid;
  void event.payload.queue;
});

// После reconnect — snapshot, не replay events
const snap = await client.getSnapshot();
void snap.sections.operator?.campaign;
void snap.sections.calls;

stop();
```

</details>

`queueLabel` на `call:*` — additive desktop-safe title; повтор с тем же `callId` — enrichment, не второй lead.

---

## Ошибки

Класс: `OmniCallClientError` (`code`, `retryable`, `currentRevision?`, `details?`).

| Guard / reader | Когда |
| --- | --- |
| `isOmniCallClientError` | Базовая проверка |
| `isConflictError` + `readConflictErrorDetails` | `conflict` |
| `isInteractionRequiredError` + `readInteractionRequiredDetails` | logout reason / UI step |
| `isOperationFailedError` + `readOperationFailedDetails` | e.g. `sip_not_registered` |
| `isOriginBlockedError` | Blacklisted Origin |

| Code | Смысл | Next step |
| --- | --- | --- |
| `forbidden` | Нет cap / Origin policy / consent Deny | Settings; не tight-loop |
| `not_ready` | Не `ready` / broker | Wait / connecting UI |
| `timeout` | Нет ответа | Retry UI; не auto-replay non-idempotent |
| `stale_state` | Revision mismatch | `getSnapshot()`; retry once |
| `conflict` | Busy / race / consent pending / hide while busy | Показать конфликт; logout-first для activate |
| `not_found` | Unknown call/login/reason | Refresh / correct login |
| `invalid_payload` | Wire fail-closed | Bug / mismatch |
| `interaction_required` | Human step | Modal / Account UI |
| `revoked` | Session revoked | Clear; re-pair |
| `incompatible_version` | Protocol mismatch | Upgrade |
| `unauthenticated` | Нужна auth | Reconnect / pair |
| `rate_limited` | Back off | Jitter |
| `operation_failed` | Generic | Log code; check `failure_kind` |
| `local_network_permission_*` | LNA | Объяснить Allow local network |
| `discovery_unreachable` | Desktop down | Запустить OmniCall |
| `origin_blocked` | Blacklist | Unblock в Settings |
| `not_owner` | Reserved; не для shared-desk call control | Unexpected — refresh |
| `invalid_message` / `unsupported_command` | Protocol mismatch | Fail closed |

Логируйте: `code`, `retryable`, `requestId` / command type. Не логируйте: полный `details`, токены, destinations сверх политики, wire frames.

EN: [errors.md](./errors.md).

---

## Reconnect и несколько вкладок

| Свойство | Поведение |
| --- | --- |
| Policy | Bounded (`maxAttempts`), jittered, cancellable |
| После успеха | Новый auth + **fresh snapshot** |
| In-flight mutations | Rejected typed; **не** auto-resent |
| Host intent | Переиздать после нового `expectedRevision` |

`disconnect()` закрывает транспорт и чистит timers/pending — **без** hangup / logout / activate / hide и без teardown desktop SIP/account.

| Multi-tab сценарий | Ожидание | UX |
| --- | --- | --- |
| Две вкладки originate | `conflict` / `stale_state` | Одна «ведущая» вкладка |
| A hold, B hangup | Обе могут успеть; later → stale | Sync из snapshot/events |
| Новый браузер после pairing | Тот же call state | `getSnapshot()` + subscribe |
| Общий PoP `installId` | Та же client identity | Один активный controller |

Никогда не делайте «retry all failed mutations on reconnect». EN: [reconnect-multi-tab.md](./reconnect-multi-tab.md).

<details>
<summary>Пример: banner на reconnecting</summary>

```ts
client.onStateChange((state) => {
  if (state === 'reconnecting') {
    // Banner only — не resend originate/hangup/logout/activate
  }
  if (state === 'ready') {
    void client.getSnapshot();
  }
});
```

</details>

---

## Типовые сценарии CRM

### 1. Softphone control panel (presentation / operator)

Pair с `presentation` или `operator` → snapshot registration/operator → `window.show` → status UI → logout при необходимости.

### 2. Dial from CRM card (`call_controller`)

`ready` → проверка `call.originate` → `originate({ destination, expectedRevision })` → UI из `call:*` events + snapshot calls.

### 3. Incoming queue agent

Subscribe `call:incoming` (+ optional `queueLabel` / `call:acd-context`) → `answer` / `reject` → hold/mute/hangup через `call.control`.

### 4. Post-call processing

`changeStatus({ target: 'break', … })` во время разговора → `kind: 'reserved'` → UI booking из `reservedTarget` → при `post_call_processing` → `finishAppeal`.

### 5. Saved-account activate (privileged)

Оператор включает `account.activate` в Origin matrix → feature-detect → `activateProfile({ login, mode? })` → consent modal на desktop → без паролей в CRM.

### 6. Hide softphone (privileged)

Grant `window.hide` → `hide({ expectedRevision })` только когда telephony idle; при `conflict` — tray / `show()`.

---

## Best practices

1. Делайте один `OmniCallClient` на вкладку/сессию CRM.
2. Держите UI state = snapshot + events; не дублируйте telephony FSM в CRM.
3. Вызывайте мутации только после `ready` и проверки capability.
4. Всегда обновляйте revision из последнего успешного результата или fresh snapshot.
5. Логируйте только `code` / `requestId` / command type — не payload.
6. Privileged flows — только через `getGrantedCapabilities()` feature-detect.
7. В тестах: `createMemoryPopKeyStore` + fake transport/scheduler; browser E2E отдельно.
8. На HTTPS CRM заранее объясняйте пользователю LNA / Local Network permission.
9. Не оборачивайте `TransportPort` собственной reconnect-логикой.
10. Pin версию `@softomnitel/omnicall-kit`; читайте [upgrade-deprecation.md](./upgrade-deprecation.md).
11. При `stale_state` / `conflict` — один осознанный retry после snapshot, не tight-loop.
12. Key CRM cards по `callId`; `queueLabel` enrichment — update, не второй lead.

---

## Частые ошибки и anti-patterns

| Нельзя | Почему | Как правильно |
| --- | --- | --- |
| `requestedCapabilities: ['account.activate']` | Strip; не elevates | Grant в Settings Origin matrix |
| Request `window.hide` на pairing | Strip | Matrix grant → `window.hide` |
| SIP password / OCP apiKey в SDK | Secrets только на desktop | `activateProfile({ login })` |
| PoP в `localStorage` / `sessionStorage` | XSS | IndexedDB / memory key store |
| Логировать phones / tokens / payloads | PII / leak | code + retryable + requestId |
| Auto-replay мутаций после reconnect | Double-originate | Fresh revision + user re-issue |
| Hangup/logout/activate на `disconnect()` | Desktop session должна жить | `disconnect` = transport only |
| Custom reconnect в TransportPort | Session owns policy | Thin browser WS adapter |
| Binary frames / свой JSON parser в port | Validation выше порта | Text frames via `onMessage` |
| `account:list-profiles` | Нет в protocol v1 | Передайте известный `login` |
| Auto-logout on disconnect | Destructive | Logout только после confirm |
| Origin substring / wildcard | Exact only | Exact Origin string |
| Отдельный CRM `reserveStatus` | OCP FSM leak | Всегда `changeStatus` → `kind` |
| Mid-call `unknown` как полный OCP enum | Anti-corruption | Coarse + `reservedTarget` |
| `fetch` fallback к desktop HTTP | Forbidden | Только SDK WS protocol |
| Patch call graph только из events | Gaps / drift | Snapshot SSoT + events hints |
| Слепой retry со старым revision | `stale_state` loop | `getSnapshot()` first |
| Два «ведущих» dialer на вкладках | Races | Single-writer UX |

EN: [security-anti-patterns.md](./security-anti-patterns.md).

---

## Чеклист перед продом

- [ ] Установлен `@softomnitel/omnicall-kit@0.1.0` (или осознанный pin/`rc`)
- [ ] OmniCall Desktop запущен; SDK gateway / Integrations включены
- [ ] Origin CRM exact match; TOFU Allow проверен; blacklist path понятен
- [ ] Pairing UX: инструкция при `pairing_required`; revoke → clear + re-pair
- [ ] PoP в IndexedDB (`installId` стабилен); нет Web Storage для ключей
- [ ] `requestedCapabilities` без privileged ids
- [ ] UI строится из snapshot + `PUBLIC_EVENT_TYPES`
- [ ] Все мутации с fresh `expectedRevision`; обработка `stale_state`
- [ ] Calls: originate/answer/reject/hangup/hold/mute/dtmf покрыты UX + errors
- [ ] Operator: `changeStatus`/`finishAppeal`/`getReasons` без самодельного reserve
- [ ] Logout single-shot + `interaction_required` modal
- [ ] Privileged `window.hide` / `account.activate` — только после matrix grant + feature-detect
- [ ] Reconnect: banner, fresh snapshot, no mutation replay
- [ ] Multi-tab: single-writer или явный user retry
- [ ] LNA permission объяснена на HTTPS
- [ ] Логи без PII/secrets; ошибки по `code`
- [ ] Нет SIP/OCP secrets в CRM bundle
- [ ] Версии SDK/desktop совместимы ([compatibility-matrix.md](./compatibility-matrix.md))
- [ ] Upgrade notes прочитаны ([upgrade-deprecation.md](./upgrade-deprecation.md))

---

## Куда смотреть дальше

| Документ | Зачем |
| --- | --- |
| [README гайда (EN index)](./README.md) | Оглавление EN pages |
| [API reference](./api-reference.md) | Namespaces + inventory 77 |
| [API report](../../etc/api/sdk.api.md) | Канон публичных символов |
| [Events](./events.md) | Каталог событий |
| [Errors](./errors.md) | Коды + next steps |
| [Capabilities](./capabilities.md) | Profiles / privileged |
| [Pairing quick start](./pairing-quick-start.md) | Connect ladder |
| [Transport](./transport.md) | WebSocket port |
| [Installation](./installation.md) | Engines / LNA |
| [TypeScript](./typescript.md) | Imports / `OmniCallEventOf` |
| [Reconnect & multi-tab](./reconnect-multi-tab.md) | Fresh snapshot policy |
| [Logout](./logout-workflow.md) | Single-shot logout |
| [Saved-account activation](./saved-profile-activation.md) | activateProfile |
| [Operator status & reservation](./operator-status-reservation.md) | applied \| reserved |
| [Security anti-patterns](./security-anti-patterns.md) | Forbidden table |
| [Release & support](./release-and-support.md) | RC / stable / support |
| [Example crm-pairing-lite](../../examples/crm-pairing-lite/) | Fake-peer demo |

# OmniCall Kit

`@softomnitel/omnicall-kit` — типизированный JavaScript/TypeScript-клиент для
CRM. Он подключает страницу CRM к уже установленному **OmniCall Desktop** на
компьютере оператора.

SDK получает состояние звонков и оператора, а также отправляет разрешённые
команды: начать звонок, ответить, положить трубку или изменить статус. SIP,
пароли и внутренняя телефония остаются внутри Desktop и не попадают в браузер.

```ts
import {
  createIndexedDbPopKeyStore,
  createOmniCallClient
} from '@softomnitel/omnicall-kit';

const client = createOmniCallClient({ /* параметры ниже */ });
await client.connect();
await client.waitUntil((state) => state === 'ready');
const snapshot = await client.getSnapshot();
console.log(snapshot.revision);
```

## Содержание

- [Что нужно для работы](#что-нужно-для-работы)
- [Установка](#установка)
- [Быстрый старт](#быстрый-старт)
- [Основные понятия](#основные-понятия)
- [Состояния и события](#состояния-и-события)
- [API Reference](#api-reference)
- [Форматы успешных ответов](#форматы-успешных-ответов)
- [Рецепты](#рецепты)
- [Ошибки и FAQ](#ошибки-и-faq)
- [Миграция и совместимость](#миграция-и-совместимость)

## Что нужно для работы

1. OmniCall Desktop должен быть установлен, запущен и иметь включённый SDK
   gateway.
2. Страница CRM должна работать в Chromium или Edge на Chromium.
3. Для сборки проекта нужен Node.js `>=20.19.0` и npm `>=10`.
4. В браузере нужны Web Crypto и IndexedDB. Они хранят криптографическую
   идентичность браузера.
5. Если CRM работает по HTTPS, браузер может спросить разрешение на связь с
   локальной программой. Объясните это действие оператору в интерфейсе.

Firefox и Safari пока не входят в заявленную матрицу поддержки.

## Установка

```bash
npm install @softomnitel/omnicall-kit
```

Для воспроизводимой production-сборки зафиксируйте версию, доступную в вашем
закрытом npm registry:

```bash
npm install @softomnitel/omnicall-kit@0.1.4
```

Пакет ESM-only. Импортируйте его через `import`, а не `require`.

## Быстрый старт

### 1. Создайте хранилище идентичности браузера

При первом подключении оператор подтверждает, что CRM может работать с Desktop.
Этот процесс называется **pairing**. После подтверждения SDK сохраняет
криптографическую идентичность браузера в IndexedDB. Не храните её в
`localStorage` или `sessionStorage`.

```ts
import { createIndexedDbPopKeyStore } from '@softomnitel/omnicall-kit';

const keyStore = createIndexedDbPopKeyStore({
  // Стабильная строка для одной установки CRM в одном браузере.
  installId: 'crm-production'
});
```

### 2. Создайте клиент

`origin` — точный адрес CRM из браузера: схема, домен и порт. Например,
`https://crm.example`. Desktop не принимает маски и части строк.

```ts
import { createOmniCallClient } from '@softomnitel/omnicall-kit';

const client = createOmniCallClient({
  url: 'ws://127.0.0.1:17341/omnicall/v1/ws',
  origin: window.location.origin,
  application: { name: 'my-crm', version: '1.0.0' },
  sdkVersion: '0.1.4',
  requestedProfile: 'call_controller',
  requestedCapabilities: [
    'session.read.redacted',
    'window.show',
    'call.originate',
    'call.control',
    'operator.status.write',
    'session.logout'
  ],
  keyStore
});
```

`requestedCapabilities` — это просьба о правах, а не их выдача. Desktop выдаёт
только права, разрешённые для этого Origin. Права `account.activate` и
`window.hide` нельзя запросить при pairing: оператор выдаёт их отдельно в
настройках Desktop.

### 3. Покажите оператору, что pairing ожидает подтверждения

```ts
client.onPairingRequired((info) => {
  console.info(
    `Подтвердите подключение ${info.origin} в окне OmniCall Desktop.`
  );
});

client.onStateChange((state) => {
  console.info(`Состояние SDK: ${state}`);
});
```

Подписки возвращают функцию отписки. Вызовите её при размонтировании компонента
или закрытии вкладки.

### 4. Подключитесь и получите состояние

`connect()` начинает сетевое подключение и возвращает `Promise`. `Promise`
означает результат, который появится позже. `await` ждёт этот результат, не
блокируя браузер.

```ts
await client.connect();
await client.waitUntil((state) => state === 'ready', 60_000);

const snapshot = await client.getSnapshot();
console.log('Версия состояния:', snapshot.revision);
console.log('Звонки:', snapshot.sections.calls);
```

Если состояние стало `pairing_required`, оператор должен подтвердить CRM в
OmniCall Desktop. Не создавайте второй клиент и не повторяйте `connect()` в
цикле.

## Основные понятия

| Понятие | Что это означает для CRM |
| --- | --- |
| OmniCall Desktop | Программа на компьютере оператора. Она владеет телефонией и учётной записью. |
| pairing | Первое подтверждение доступа конкретного сайта к Desktop. |
| capability | Право на одну группу действий, например `call.originate`. Проверяйте выданные права перед показом кнопки. |
| snapshot | Полный согласованный снимок состояния Desktop. Это главный источник данных для интерфейса CRM. |
| event | Уведомление об изменении, например `call:incoming`. Событие помогает быстро обновить UI, но не заменяет snapshot. |
| revision | Номер версии snapshot. Перед командой, меняющей состояние, передайте актуальный номер в `expectedRevision`. |

Поток данных выглядит так:

```text
CRM в браузере
  → OmniCall Kit
  → локальный WebSocket на 127.0.0.1
  → OmniCall Desktop
  → телефония и операторская платформа
```

SDK не является вторым телефоном. Он не даёт CRM SIP-пароль, не открывает
внутренний протокол операторской платформы и не поддерживает legacy
`window.Softphone`.

### Snapshot, события и revision

После `ready` вызовите `getSnapshot()`. Далее подпишитесь на события. После
reconnect снова получите snapshot.

Команда изменения состояния принимает `expectedRevision`. Если Desktop уже
изменился в другой вкладке, SDK отклонит команду с кодом `stale_state`. Получите
новый snapshot и дайте пользователю повторить намеренное действие.

```ts
async function getRevision(): Promise<number> {
  return client.getRevision() ?? (await client.getSnapshot()).revision;
}

const result = await client.calls.originate({
  destination: '+74951234567',
  expectedRevision: await getRevision()
});

console.log(result.callId, result.revision);
```

`getRevision()` читает только revision кэшированного snapshot. Успешная мутация
возвращает новый `result.revision`, но не патчит этот кэш. Для следующей команды
либо сохраните `result.revision` как локальную последовательность мутаций, либо
сначала вызовите `getSnapshot()`; после события, reconnect или действий другой
вкладки выбирайте только свежий snapshot.

Не повторяйте автоматически `originate`, `hangup`, `logout` или
`activateProfile` после reconnect. Эти действия могут сработать дважды.

## Форматы успешных ответов

Асинхронная команда либо завершается типизированным успешным результатом, либо
отклоняет `Promise` с `OmniCallClientError`. Ошибка никогда не приходит как
частично успешный объект. Поле `revision` в успешном результате — версия Desktop
после команды. Это **не** обновляет `getRevision()`: кэш snapshot меняет только
`getSnapshot()`, а события его не патчат.

| Команда | Успешный ответ | Как обрабатывать |
| --- | --- | --- |
| `calls.*` | `{ callId, revision }` | Команда принята для этого звонка. Фазу звонка показывайте по событию или snapshot, а не предполагаемому результату команды. |
| `operator.getReasons()` | `{ reasons: [{ id, label, kind }], revision }` | Фильтруйте по `kind`; в следующую команду передавайте выбранный числовой `id`. |
| `operator.changeStatus()` | `{ accepted: true, kind, targetStatus, reasonId, revision }` | Обязательно ветвитесь по `kind`: `applied` меняет статус сейчас, `reserved` только бронирует `targetStatus`/`reasonId` до конца обращения. |
| `operator.finishAppeal()` | Та же форма, что у `changeStatus()` | Разрешён только при `post_call_processing`; применяет бронь либо Desktop-default Ready. |
| `account.logout()` | `{ loggedOut: true, revision }` | Очищайте UI сессии после ответа/события или подтверждающего snapshot. `interaction_required` — это отклонение Promise, а не вариант успеха. |
| `account.activateProfile()` | `{ activated: true, mode, profileLabel?, alreadyAuthenticated?, revision }` | `alreadyAuthenticated: true` — успешный no-op. В ответе никогда нет пароля или ключа OCP. |
| `window.show()` / `hide()` / `getState()` | `{ visible, revision }` | Используйте фактическое `visible`; `show()` и `getState()` не требуют `expectedRevision`. |

### Смена статуса и резервирование

`changeStatus()` — единственная публичная команда для намерения Ready/Break.
Не создавайте отдельный reserve API и не решайте на стороне CRM, занят ли оператор:
Desktop сам выбирает результат.

```ts
const result = await client.operator.changeStatus({
  target: 'break',
  reasonId: 12,
  expectedRevision: await getRevision()
});

if (result.kind === 'applied') {
  // targetStatus применён сейчас; обновление UI всё равно подтвердят событие/snapshot.
} else {
  // Бронь после текущего обращения: текущий статус-chip не становится Break.
  // result.targetStatus и result.reasonId — забронированные значения.
}
```

При `kind: 'reserved'` текущий публичный статус может остаться `unknown` во
время звонка или стать `post_call_processing` после него. Долгоживущую бронь
восстанавливайте только из свежего
`snapshot.sections.operator?.reservedTarget` /
`reservedReasonId` или `operator:status-changed`, особенно после reconnect.

Когда snapshot показывает `post_call_processing`, вызовите
`finishAppeal({ expectedRevision })`. Его успешный ответ имеет ту же форму:
`kind: 'applied'`, `targetStatus` и `reasonId` — значения, фактически применённые
Desktop. Вне post-call команда отклоняется `conflict`
(`failure_kind: 'not_in_post_call_processing'`); ждите корректный snapshot, а не
повторяйте запрос в цикле.

`error.details` остаётся расширяемым объектом. Не разбирайте его произвольные
поля: используйте type guard и `read*Details` из раздела API Reference.

## Состояния и события

### Состояния подключения

| Состояние | Что показать пользователю |
| --- | --- |
| `idle` | Кнопку подключения. |
| `connecting`, `handshaking`, `authenticating` | Индикатор процесса. |
| `pairing_required` | Инструкцию подтвердить CRM в Desktop. |
| `ready` | Основной интерфейс CRM. |
| `reconnecting` | Неблокирующее сообщение о восстановлении связи. |
| `revoked` | Очистите UI сессии и предложите пройти pairing снова. |
| `incompatible` | Предложите обновить CRM SDK или Desktop. |
| `failed` | Покажите безопасное описание ошибки из `getConnectError()`. |
| `closed` | Разрешите пользователю подключиться снова. |

### События

Подписывайтесь только на имена из `PUBLIC_EVENT_TYPES`.

| Событие | Назначение |
| --- | --- |
| `call:incoming` | Показать входящий звонок и кнопки ответа или отклонения. |
| `call:outgoing`, `call:ringing`, `call:answered` | Обновить ход исходящего или активного звонка. |
| `call:ended`, `call:failed` | Убрать карточку звонка или показать ошибку. |
| `call:held`, `call:resumed`, `call:muted`, `call:unmuted` | Обновить кнопки управления разговором. |
| `call:acd-context` | Получить публичный контекст очереди, если выдано право `ocp.acd_context.read`. |
| `registration:changed` | Обновить индикатор регистрации телефонии. |
| `account:session-activated`, `account:session-ended` | Обновить состояние учётной записи. |
| `operator:session-changed`, `operator:status-changed` | Обновить статус оператора и отложенную смену статуса. |
| `operator:campaign-offered`, `operator:campaign-cleared` | Обновить данные кампании. |
| `window:visibility-changed` | Обновить состояние окна Desktop. |
| `sdk:server-shutdown` | Показать сообщение, что Desktop завершает работу. |

```ts
const stop = client.subscribe('call:incoming', (event) => {
  console.log('Входящий звонок:', event.payload.callId);
});

// Позднее, например при размонтировании UI:
stop();
```

## API Reference

### `createOmniCallClient(options)`

Создаёт полный клиент CRM. Конструктор не открывает сеть; вызовите `connect()`.

```ts
function createOmniCallClient(options: OmniCallClientOptions): OmniCallClient;
```

`OmniCallClientOptions` равен `AuthClientOptions`.

| Поле | Тип | Обязательно | Описание |
| --- | --- | --- | --- |
| `url` | `string` | Да | WebSocket URL SDK gateway Desktop. |
| `origin` | `string` | Да | Точный Origin CRM. |
| `application` | `ApplicationIdentity` | Да | Имя и версия вашего приложения. |
| `sdkVersion` | `string` | Да | Версия SDK, совместимая с Desktop. |
| `requestedProfile` | `PairingProfile` | Да | `presentation`, `operator` или `call_controller`. |
| `requestedCapabilities` | `readonly CapabilityId[]` | Нет | Запрашиваемые неприоритетные права. |
| `keyStore` | `PopKeyStore` | Да | Хранилище идентичности pairing. |
| `transportFactory`, `scheduler`, `jitter` | соответствующие интерфейсы | Нет | Заменяйте только в тестах или особой среде. Браузерные значения используются по умолчанию. |
| `diagnostics` | `DiagnosticsSink` | Нет | Получатель безопасных диагностических событий. |
| `defaultRequestTimeoutMs` | `number` | Нет | Таймаут команд в миллисекундах. |
| `reconnect` | `ReconnectPolicy` | Нет | Политика ограниченных повторных подключений. |
| `heartbeat` | `HeartbeatPolicy` | Нет | Настройка проверки живости соединения. |

Возвращает `OmniCallClient`. Ошибки настройки и соединения приходят через
`Promise` методов клиента как `OmniCallClientError`.

### `OmniCallClient`

Полный клиент состоит из lifecycle-методов и namespaces `calls`, `window`,
`operator`, `account`.

#### `client.connect()`

```ts
(): Promise<void>
```

Открывает соединение и запускает pairing либо восстановление сессии. Promise
может быть отклонён ошибкой соединения. После успешного вызова всё ещё ждите
`ready` через `waitUntil()` или `onStateChange()`.

#### `client.disconnect()`

```ts
(): void
```

Закрывает только соединение SDK, отменяет таймеры и ожидающие запросы. Не
завершает звонок, не выполняет logout и не закрывает Desktop.

#### `client.getState()`

```ts
(): ConnectionState
```

Возвращает текущее состояние из таблицы выше. Не выполняет сетевой запрос.

#### `client.waitUntil(predicate, timeoutMs?)`

```ts
(predicate: (state: ConnectionState) => boolean, timeoutMs?: number)
  => Promise<ConnectionState>
```

Ждёт состояние, подходящее условию. `timeoutMs` не обязателен. При превышении
времени Promise отклоняется.

```ts
await client.waitUntil((state) => state === 'ready', 60_000);
```

#### `client.onStateChange(listener)` и `client.onPairingRequired(listener)`

```ts
(listener: (state: ConnectionState) => void): () => void
(listener: (info: PairingRequiredInfo) => void): () => void
```

Подписывают на изменение состояния или ожидание pairing. Оба метода возвращают
функцию отписки. `PairingRequiredInfo` содержит `origin`, `requestedProfile` и
может содержать `clientId`.

#### `client.getSession()` и `client.getGrantedCapabilities()`

```ts
(): AuthSessionSnapshot | undefined
(): readonly CapabilityId[]
```

`getSession()` возвращает текущую сессию после авторизации либо `undefined`.
`getGrantedCapabilities()` возвращает права, которые Desktop действительно
выдал. Проверяйте их до показа кнопок.

```ts
const canDial = client.getGrantedCapabilities().includes('call.originate');
```

#### `client.getSnapshot()`, `getCachedSnapshot()` и `getRevision()`

```ts
(): Promise<SnapshotMessage>
(): SnapshotMessage | undefined
(): number | undefined
```

`getSnapshot()` запрашивает свежий снимок. `getCachedSnapshot()` не обращается в
сеть. `getRevision()` возвращает номер кэшированного снимка. Используйте свежий
snapshot перед мутацией.

#### `client.subscribe(type, listener)`

```ts
<T extends PublicEventType>(
  type: T,
  listener: (event: OmniCallEventOf<T>) => void
): () => void
```

Подписывает на одно публичное событие и возвращает функцию отписки. Тип полезной
нагрузки выводится из значения `type`.

#### `client.getConnectError()` и `client.preauthDropCount()`

```ts
(): OmniCallClientError | undefined
(): number
```

Первый метод возвращает последнюю ошибку подключения. Второй возвращает
диагностический счётчик сообщений, отброшенных до авторизации. Не используйте его
как бизнес-метрику CRM.

### `client.calls`

Все методы ниже возвращают `Promise<CallMutationResult>`, где есть `callId` и
новый `revision`. Все требуют актуальный `expectedRevision`.

| Метод и сигнатура | Назначение | Право |
| --- | --- | --- |
| `originate({ destination, expectedRevision })` | Начать исходящий звонок на строку `destination`. | `call.originate` |
| `answer({ callId, expectedRevision })` | Ответить на входящий звонок. | `call.answer` или `call.control` |
| `reject({ callId, expectedRevision })` | Отклонить входящий звонок. | `call.reject` или `call.control` |
| `hangup({ callId, expectedRevision })` | Завершить звонок. | `call.hangup` или `call.control` |
| `hold({ callId, expectedRevision })` | Поставить звонок на удержание. | `call.hold` или `call.control` |
| `resume({ callId, expectedRevision })` | Снять звонок с удержания. | `call.hold` или `call.control` |
| `mute({ callId, expectedRevision })` | Выключить микрофон. | `call.mute` или `call.control` |
| `unmute({ callId, expectedRevision })` | Включить микрофон. | `call.mute` или `call.control` |
| `sendDtmf({ callId, digits, expectedRevision })` | Отправить тональные цифры `digits`. | Только `call.control` |

Параметр `callId` — идентификатор звонка из snapshot или события. Возможные
ошибки: `forbidden`, `not_ready`, `not_found`, `stale_state`, `conflict` и
`operation_failed`.

Каждый метод использует один из двух контрактов:

```ts
type CallActionInput = { callId: string; expectedRevision: number };
type OriginateInput = { destination: string; expectedRevision: number };
type DtmfInput = { callId: string; digits: string; expectedRevision: number };
type CallAction = (input: CallActionInput) => Promise<CallMutationResult>;
```

#### `client.calls.originate(input)`

```ts
(input: OriginateInput): Promise<CallMutationResult>
```

Набирает `destination`. Передавайте номер в формате, который поддерживает
ваша телефония. Проверьте `call.originate`; при `operation_failed` с
`failure_kind: 'sip_not_registered'` сначала восстановите регистрацию Desktop.

```ts
const revision = client.getRevision() ?? (await client.getSnapshot()).revision;
const result = await client.calls.originate({
  destination: '+74951234567',
  expectedRevision: revision
});
console.log(result.callId);
```

#### `client.calls.answer(input)`

```ts
(input: CallActionInput): Promise<CallMutationResult>
```

Отвечает на звонок `callId`. Вызывайте только для входящего звонка из snapshot
или `call:incoming`. Если звонок уже завершён в другой вкладке, получите
`not_found`, `conflict` или `stale_state`.

```ts
await client.calls.answer({ callId: 'call-123', expectedRevision: await getRevision() });
```

#### `client.calls.reject(input)`

```ts
(input: CallActionInput): Promise<CallMutationResult>
```

Отклоняет входящий звонок. Аргументы и ошибки совпадают с `answer()`.

```ts
await client.calls.reject({ callId: 'call-123', expectedRevision: await getRevision() });
```

#### `client.calls.hangup(input)`

```ts
(input: CallActionInput): Promise<CallMutationResult>
```

Завершает звонок. Не вызывайте его автоматически в обработчике `disconnect()`.

```ts
await client.calls.hangup({ callId: 'call-123', expectedRevision: await getRevision() });
```

#### `client.calls.hold(input)` и `client.calls.resume(input)`

```ts
(input: CallActionInput): Promise<CallMutationResult>
```

`hold()` ставит активный звонок на удержание, а `resume()` возвращает его в
разговор. Оба требуют `call.hold` или `call.control`.

```ts
await client.calls.hold({ callId: 'call-123', expectedRevision: await getRevision() });
await client.calls.resume({ callId: 'call-123', expectedRevision: await getRevision() });
```

#### `client.calls.mute(input)` и `client.calls.unmute(input)`

```ts
(input: CallActionInput): Promise<CallMutationResult>
```

`mute()` выключает, а `unmute()` включает микрофон оператора. Оба требуют
`call.mute` или `call.control`.

```ts
await client.calls.mute({ callId: 'call-123', expectedRevision: await getRevision() });
await client.calls.unmute({ callId: 'call-123', expectedRevision: await getRevision() });
```

#### `client.calls.sendDtmf(input)`

```ts
(input: DtmfInput): Promise<CallMutationResult>
```

Отправляет тональные цифры `digits` во время подходящего звонка. Требует только
`call.control`; не используйте для передачи секретов.

```ts
await client.calls.sendDtmf({
  callId: 'call-123',
  digits: '123#',
  expectedRevision: await getRevision()
});
```

### `client.window`

| Метод | Сигнатура и результат | Условие |
| --- | --- | --- |
| `show()` | `(): Promise<{ visible: boolean; revision: number }>` | Право `window.show`. |
| `hide(input)` | `({ expectedRevision: number }) => Promise<{ visible: boolean; revision: number }>` | Привилегированное право `window.hide`; Desktop может вернуть `conflict`, если идёт разговор. |
| `getState()` | `(): Promise<{ visible: boolean; revision: number }>` | Только чтение состояния окна. |

```ts
await client.window.show();
```

#### `client.window.show()`

```ts
(): Promise<{ visible: boolean; revision: number }>
```

Показывает и фокусирует окно Desktop. Требует `window.show`. Результат содержит
фактическую видимость и новую версию состояния.

#### `client.window.hide(input)`

```ts
({ expectedRevision }: { expectedRevision: number })
  => Promise<{ visible: boolean; revision: number }>
```

Скрывает окно. Требует отдельно выданное привилегированное `window.hide`.
Desktop отклоняет запрос с `conflict`, когда скрытие небезопасно, например во
время разговора.

```ts
await client.window.hide({ expectedRevision: await getRevision() });
```

#### `client.window.getState()`

```ts
(): Promise<{ visible: boolean; revision: number }>
```

Запрашивает видимость окна, ничего не меняя.

```ts
const { visible } = await client.window.getState();
```

### `client.account`

#### `client.account.logout(input)`

```ts
({ reasonId?, expectedRevision }: {
  reasonId?: number;
  expectedRevision: number;
}) => Promise<LogoutResult>
```

Завершает операторскую сессию. Возвращает `{ loggedOut: true, revision }`.
Desktop может потребовать причину и вернуть `interaction_required`. В этом случае
получите причины через `client.operator.getReasons()`, покажите их пользователю и
повторите logout со свежим revision и выбранным `reasonId`.

#### `client.account.activateProfile(input)`

```ts
({ login, expectedRevision, mode? }: {
  login: string;
  expectedRevision: number;
  mode?: 'sip_only' | 'ocp';
}) => Promise<ActivateProfileResult>
```

Активирует ранее сохранённый в Desktop профиль без передачи пароля в CRM.
`mode` по умолчанию определяет Desktop. Возвращает `activated`, `mode`,
необязательные `profileLabel`, `alreadyAuthenticated` и `revision`. Требует
выданное сервером право `account.activate`.

### `client.operator`

| Метод | Сигнатура и результат | Ошибки и ограничения |
| --- | --- | --- |
| `getReasons()` | `(): Promise<{ reasons: OperatorReason[]; revision: number }>` | Получает причины ready, break и logout. |
| `changeStatus(input)` | `({ target: 'ready' \| 'break', reasonId?, expectedRevision }) => Promise<OperatorStatusChangeResult>` | Требует `operator.status.write`. Результат содержит `kind: 'applied' \| 'reserved'`. |
| `finishAppeal(input)` | `({ expectedRevision }) => Promise<OperatorFinishAppealResult>` | Доступен в состоянии post-call processing. |

`reserved` означает: Desktop запомнил запрошенный статус и применит его после
текущего разговора. Не создавайте в CRM отдельную команду резервирования.

#### `client.operator.getReasons()`

```ts
(): Promise<OperatorReasonsResult>
```

Возвращает причины статусов и logout с полями `id`, `label`, `kind`, а также
`revision`. Используйте `id` выбранной оператором причины в следующей команде.

```ts
const { reasons } = await client.operator.getReasons();
console.log(reasons.filter((reason) => reason.kind === 'break'));
```

#### `client.operator.changeStatus(input)`

```ts
({ target, reasonId?, expectedRevision }: {
  target: 'ready' | 'break';
  reasonId?: number;
  expectedRevision: number;
}) => Promise<OperatorStatusChangeResult>
```

Меняет статус на `ready` или `break`. Возвращает `accepted: true`, реальный
`targetStatus`, `reasonId`, `revision` и `kind`. При активном разговоре `kind`
может быть `reserved`, а не `applied`.

```ts
await client.operator.changeStatus({
  target: 'ready',
  expectedRevision: await getRevision()
});
```

#### `client.operator.finishAppeal(input)`

```ts
({ expectedRevision }: { expectedRevision: number })
  => Promise<OperatorFinishAppealResult>
```

Заканчивает постобработку обращения. Вызывайте только когда публичный статус
оператора — `post_call_processing`; в остальных случаях Desktop вернёт ошибку
состояния или конфликта.

```ts
await client.operator.finishAppeal({ expectedRevision: await getRevision() });
```

## Ошибки

### `OmniCallClientError`

```ts
new OmniCallClientError({
  code: ProtocolErrorCode,
  retryable: boolean,
  currentRevision?: number,
  details?: WireJsonObject
});
```

Это класс ошибок SDK. Свойства `code`, `retryable`, `currentRevision` и `details`
помогают выбрать действие. Не выводите весь `details` в production-логи: там
могут быть чувствительные данные.

| Проверка и reader | Когда применять |
| --- | --- |
| `isOmniCallClientError(value)` | Проверить любую ошибку SDK. |
| `isConflictError(error)` + `readConflictErrorDetails(details)` | Обработать `conflict`. |
| `isInteractionRequiredError(error)` + `readInteractionRequiredDetails(details)` | Выбрать причину logout. |
| `isOperationFailedError(error)` + `readOperationFailedDetails(details)` | Узнать `failure_kind`, например `sip_not_registered`. |
| `isOriginBlockedError(value)` | Обработать заблокированный Origin. |

```ts
import {
  isOmniCallClientError,
  isOperationFailedError,
  readOperationFailedDetails
} from '@softomnitel/omnicall-kit';

try {
  await client.calls.originate({
    destination: '+74951234567',
    expectedRevision: await getRevision()
  });
} catch (error: unknown) {
  if (isOperationFailedError(error)) {
    console.warn(readOperationFailedDetails(error.details)?.failure_kind);
  } else if (isOmniCallClientError(error)) {
    console.warn(error.code, error.retryable);
  } else {
    throw error;
  }
}
```

## Вспомогательные фабрики и низкоуровневые интерфейсы

Это API для тестов, нестандартных runtime-сред и диагностики. В обычной браузерной
CRM ничего из этого передавать в `createOmniCallClient()` не нужно.

| Экспорт | Сигнатура | Для чего нужен |
| --- | --- | --- |
| `createAuthClient(options)` | `(AuthClientOptions) => AuthClient` | Клиент только pairing и lifecycle без `calls`, `window`, `operator`, `account`. |
| `createIndexedDbPopKeyStore({ installId })` | `({ installId: string }) => PopKeyStore` | Постоянное браузерное хранилище pairing. |
| `createMemoryPopKeyStore(initial?)` | `(StoredPopIdentity?) => PopKeyStore & { peek() }` | Временное хранилище для тестов. |
| `createBrowserWebSocketTransport(options?)` | `({ webSocket? }?) => TransportPort` | Стандартный транспорт браузера. |
| `createBrowserScheduler()` | `() => Scheduler` | Реальные таймеры браузера. |
| `createBrowserJitterSource()` | `() => JitterSource` | Случайная задержка reconnect. |
| `createFakeScheduler(startMs?)` | `(number?) => FakeScheduler` | Управляемые таймеры в тестах. |
| `createFixedJitterSource(value)` | `(number) => JitterSource` | Предсказуемый jitter в тестах. |
| `createRecordingDiagnosticsSink()` | `() => DiagnosticsSink & { events; clear() }` | Сбор безопасных диагностических событий. |

`PopKeyStore` имеет методы `load()`, `save(identity)` и `clear()`. Его
`StoredPopIdentity` содержит `clientId`, открытый ключ, непередаваемый
`CryptoKey`, профиль и выданные права. Не сериализуйте приватный `CryptoKey` и не
отправляйте его на сервер CRM.

`TransportPort` определяет `connect(url)`, `send(data)`, `close(code?, reason?)`
и подписки `onOpen`, `onMessage`, `onClose`, `onError`. Он работает только со
строковыми сообщениями. Не добавляйте в него собственный JSON-парсер или цикл
reconnect: этим управляет сессия SDK.

`Scheduler` определяет `now()` и `setTimeout(callback, delayMs)`. Возвращаемый
`TimerHandle` имеет `clear()`. `FakeScheduler` добавляет `advanceBy`,
`advanceByAsync`, `pendingTimerCount` и `clearAll`.

### Политики и диагностика

```ts
type ReconnectPolicy = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
};

type HeartbeatPolicy = {
  enabled: boolean;
  intervalMs: number;
  timeoutMs: number;
};
```

`DiagnosticsSink.emit(event)` получает `DiagnosticEvent`: уровень
`debug | info | warn | error`, код, состояние и необязательные `requestId`,
`commandType`, длительность и ошибку. Логируйте коды и идентификаторы запросов,
но не логируйте номера телефонов, токены или полный payload.

## Типы, константы и полный индекс экспорта

Ниже перечислены все публичные экспорты пакета. Для структур сообщений протокола
`SnapshotMessage`, `SnapshotSections`, `SnapshotCallSummary`,
`ApplicationIdentity`, `CapabilityId`, `ProtocolErrorCode`,
`PublicOperatorStatus` и `WireJsonObject` используйте TypeScript-типы из
`@softomnitel/omnicall-kit` и `@softomnitel/omnicall-protocol`: они
re-exported из протокольного пакета.

| Группа | Экспорты |
| --- | --- |
| Клиент и auth | `OmniCallClient`, `OmniCallClientOptions`, `AuthClient`, `AuthClientOptions`, `AuthSessionSnapshot`, `PairingRequiredInfo`, `CONNECTION_STATES`, `ConnectionState` |
| Команды и результаты | `OmniCallCallsApi`, `OmniCallWindowApi`, `OmniCallAccountApi`, `OmniCallOperatorApi`, `CallMutationResult`, `LogoutResult`, `ActivateProfileMode`, `ActivateProfileResult`, `OperatorReason`, `OperatorReasonsResult`, `OperatorStatusChangeKind`, `OperatorStatusChangeResult`, `OperatorFinishAppealResult` |
| События | `PUBLIC_EVENT_TYPES`, `PublicEventType`, `OmniCallEvent`, `OmniCallEventOf` |
| Ошибки | `OmniCallClientError`, `ConflictErrorDetails`, `InteractionRequiredDetails`, `OperationFailedDetails`, пять type guard/readers из раздела ошибок |
| Хранилище | `PopKeyStore`, `StoredPopIdentity`, `createIndexedDbPopKeyStore`, `createMemoryPopKeyStore` |
| Транспорт | `BrowserWebSocketConstructor`, `BrowserWebSocketLike`, `CreateBrowserWebSocketTransportOptions`, `TransportFactory`, `TransportPort`, `TransportCloseInfo`, `TransportErrorInfo`, `createBrowserWebSocketTransport` |
| Время и reconnect | `Scheduler`, `TimerHandle`, `FakeScheduler`, `JitterSource`, `ReconnectPolicy`, `HeartbeatPolicy`, `createBrowserScheduler`, `createBrowserJitterSource`, `createFakeScheduler`, `createFixedJitterSource` |
| Диагностика | `DiagnosticsSink`, `DiagnosticEvent`, `DiagnosticLevel`, `DiagnosticResult`, `createRecordingDiagnosticsSink` |
| Протокольные re-export | `CapabilityId`, `ProtocolErrorCode`, `PublicOperatorStatus`, `SnapshotMessage`, `SnapshotSections`, `SnapshotCallSummary`, `WireJsonObject` |
| Константы activation | `SDK_ACTIVATE_CONSENT_TTL_MS`, `SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS`, `SDK_ACTIVATE_OCP_AUTH_BUDGET_MS`, `SDK_ACTIVATE_CLIENT_TIMEOUT_MS` |

Четыре константы activation задают верхние границы ожидания согласия и
авторизации в миллисекундах. Используйте их, если вашему UI нужно показать
таймер; не меняйте их смысл локальными таймаутами.

## Рецепты

### Обновить UI после reconnect

```ts
client.onStateChange((state) => {
  if (state === 'ready') {
    void client.getSnapshot().then((snapshot) => {
      console.log('Обновите UI из снимка', snapshot.revision);
    });
  }
});
```

### Безопасно сменить статус оператора

```ts
const expectedRevision =
  client.getRevision() ?? (await client.getSnapshot()).revision;

const result = await client.operator.changeStatus({
  target: 'break',
  expectedRevision
});

if (result.kind === 'reserved') {
  console.info('Перерыв начнётся после текущего разговора.');
}
```

### Logout с выбором причины

```ts
const { reasons } = await client.operator.getReasons();
const reason = reasons.find((item) => item.kind === 'logout');

if (reason !== undefined) {
  await client.account.logout({
    reasonId: reason.id,
    expectedRevision: await getRevision()
  });
}
```

## Ошибки и FAQ

### `stale_state`: команда отклонена

Другая вкладка или Desktop изменили состояние после вашего snapshot. Вызовите
`getSnapshot()`, обновите UI и попросите пользователя повторить действие. Не
повторяйте команду со старым `expectedRevision`.

### `forbidden`: кнопка не работает

Desktop не выдал capability или оператор запретил Origin. Проверьте
`getGrantedCapabilities()`. Для `window.hide` и `account.activate` оператор
должен выдать право в Origin matrix Desktop.

### `pairing_required` не заканчивается

Оператор ещё не подтвердил CRM в OmniCall Desktop. Покажите адрес из
`PairingRequiredInfo.origin` и не скрывайте это состояние под бесконечным
спиннером.

### `local_network_permission_required` или `_denied`

Браузер не разрешил HTTPS-странице обратиться к локальной программе. Объясните,
где выдать разрешение, затем разрешите оператору подключиться снова.

### Нужен ли отдельный WebSocket-клиент?

Нет. Используйте `createOmniCallClient()` и транспорт SDK по умолчанию. Свой
WebSocket-клиент обходит проверку сообщений и может нарушить reconnect.

### Можно ли хранить SIP-пароль или ключ OCP в CRM?

Нет. Эти секреты остаются в OmniCall Desktop. Для ранее сохранённого профиля
используйте `activateProfile({ login, ... })` после явной выдачи capability.

## Миграция и совместимость

SDK не совместим с legacy `window.Softphone` и не предоставляет HTTP fallback.
Переносите интеграцию на `createOmniCallClient()`, snapshot, публичные события и
namespaces клиента.

При `incompatible_version` остановите функции телефонии и предложите обновить
пакет или Desktop. Добавление необязательных полей совместимо. Удаление,
переименование или изменение смысла API требует новой major-версии. Не опирайтесь
на недокументированные поля сетевых сообщений.

Правила для интегратора:

1. Используйте только публичные экспорты пакета `@softomnitel/omnicall-kit`.
2. Игнорируйте неизвестные необязательные поля во входящих объектах.
3. Не стройте логику на недокументированных wire-ключах.
4. При `incompatible_version` остановите telephony UI и запросите обновление.

## Лицензия

В `package.json` указано `UNLICENSED`. Это не open-source лицензия: не
предполагайте право на свободное распространение или изменение вне согласованного
контура. Уточните условия у владельца пакета.

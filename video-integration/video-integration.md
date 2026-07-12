# Video Integration — анализ legacy oktell-softphone (OS-1509)

**Источник:** `D:\Axata\oktell-archives\oktell-softphone\oktell-softphone-feature-OS-1509-source-mute-rework-latest`  
**Ветка анализа:** feature OS-1509 source-mute-rework  
**Цель документа:** полное описание видео-логики legacy-софтфона для переноса в Axatalk (`softphone-electron`).

---

## Содержание

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Инвентарь файлов](#2-инвентарь-файлов)
3. [Захват медиа: getUserMedia и stub](#3-захват-медиа-getusermedia-и-stub)
4. [Жизненный цикл видеозвонка](#4-жизненный-цикл-видеозвонка)
5. [SIP / WebRTC / SDP](#5-sip--webrtc--sdp)
6. [Redux state и события](#6-redux-state-и-события)
7. [UI: отображение видео](#7-ui-отображение-видео)
8. [Режимы отображения (SessionView)](#8-режимы-отображения-sessionview)
9. [Переключение режимов UI](#9-переключение-режимов-ui)
10. [Локальный превью (PiP)](#10-локальный-превью-pip)
11. [Трансляция экрана (screen share)](#11-трансляция-экрана-screen-share)
12. [Video mute / source mute rework (OS-1509)](#12-video-mute--source-mute-rework-os-1509)
13. [Камера: выбор, настройка, подключение](#13-камера-выбор-настройка-подключение)
14. [Настройки пользователя](#14-настройки-пользователя)
15. [Внешний API (OKTELLPhone)](#15-внешний-api-oktellphone)
16. [Edge cases и известные пробелы](#16-edge-cases-и-известные-пробелы)
17. [Диаграммы потоков](#17-диаграммы-потоков)
18. [Реализованные фичи](#18-реализованные-фичи)
19. [Плюсы и минусы реализации](#19-плюсы-и-минусы-реализации)

---

## 1. Обзор архитектуры

Legacy-софтфон — **Web-приложение** на React + Redux + модифицированный **JsSIP** (`RTCSession.js` в корне репозитория).

Видео не выделено в отдельный bounded context. Логика распределена по слоям:

| Слой | Ответственность за видео |
|------|--------------------------|
| **UI** (`SessionUI`, `SourceSelect`, settings) | Отображение `<video>`, контролы, режимы, превью камеры |
| **Session handler** (`RTCSessionHandler`) | Mute/unmute через `replaceTrack`, screen share, post-connect init |
| **Redux** (`sessions`, `userAgent`, `ui`) | Streams, meta, view mode, device settings |
| **Utilities** (`helpers/utilities.ts`) | `getLocalMediaStream`, stub canvas, device probe |
| **JsSIP** (`RTCSession.js`, `store/Sessions/actions.ts`) | SIP INVITE/answer, SDP, track events, hold, INFO |

**Ключевой принцип OS-1509:** UI-контролы mute/unmute и смены источника работают через **`RTCRtpSender.replaceTrack()` + свежий `getUserMedia`**, а не через `Session.mute()` / `Session.unmute()` JsSIP.

---

## 2. Инвентарь файлов

### Ядро медиа / SIP

| Файл | Роль |
|------|------|
| `RTCSession.js` | JsSIP session: SDP, mute internals, hold, getUserMedia fallback |
| `src/Softphone/RTCSessionHandler.tsx` | Оркестратор сессии: mute, screen share, answer, post-connect |
| `src/Softphone/helpers/utilities.ts` | `getLocalMediaStream`, `checkMediaAvailable`, stub video, stream cache |
| `src/Softphone/globals/adapter.ts` | `window.OKTELLPhone` — внешний API mute/hold/call |

### UI

| Файл | Роль |
|------|------|
| `src/Softphone/SessionUI.tsx` | Video frames, portals, controls по режимам, placeholder |
| `src/Softphone/SelectView.tsx` | Переключатель режимов minified/expanded/fullscreen |
| `src/Softphone/UAWrapper.tsx` | DOM-контейнеры `#expanded-*`, `#fullscreen-*` |
| `src/Softphone/UI/LocalStreamPreview.tsx` | Локальный PiP-превью |
| `src/Softphone/UI/LocalStreamUI.tsx` | Кнопка «Показать мою веб-камеру» |
| `src/Softphone/UX/SourceSelect/SourceSelect.tsx` | Выбор mic/cam, audio-only toggle |
| `src/Softphone/UX/SourceSelect/VideoSourceView.tsx` | Live preview выбранной камеры |
| `src/Softphone/styles/ViewModeUI.ts` | Стили layout режимов |

### State / settings

| Файл | Роль |
|------|------|
| `src/Softphone/store/Sessions/actions.ts` | Session events, remote track, SDP no-video, SIP INFO |
| `src/Softphone/store/Sessions/reducers.ts` | Local/remote MediaStream в Redux |
| `src/Softphone/store/Sessions/types.ts` | `forceVideoDisable`, `mediaStreamSource`, `isMuted` |
| `src/Softphone/store/UserAgent/actions.ts` | `Call()`, incoming session, `setNoCamera` |
| `src/Softphone/store/UserAgent/utils.ts` | `GetAvailableDevicesList`, codecs |
| `src/Softphone/store/UI/getters.ts` | `getVideoEnabled`, `getNoCamera` |
| `src/Softphone/settings/Calls.tsx` | defaultView, autoFullscreen, audioOnly |
| `src/Softphone/settings/Codecs.tsx` | Video codec priority |

---

## 3. Захват медиа: getUserMedia и stub

### `getLocalMediaStream()` — центральная функция

**Файл:** `src/Softphone/helpers/utilities.ts`

**Параметры:**

| Параметр | По умолчанию | Назначение |
|----------|--------------|------------|
| `audioOnly` | — | Только аудио, video не запрашивается |
| `videoDeviceId` | — | `deviceId: { exact: id }` или системная камера |
| `audioDeviceId` | — | Аналогично для микрофона |
| `initialVideoMute` | `true` | Video track сразу `enabled = false` |
| `cacheStream` | `true` | Добавить stream в `window.mediaStreamCache` |

**Алгоритм:**

1. Запрос аудио через `getUserMedia`. При ошибке — `alert`, return `undefined`.
2. Если `audioOnly` — return `MediaStream(audioTracks)`.
3. Запрос видео:
   - `videoDeviceId` задан → `{ video: { deviceId: { exact: videoDeviceId } } }`
   - иначе → `{ video: true }`
4. При успехе: если `initialVideoMute`, все video tracks → `enabled = false`.
5. При ошибке камеры: **`getStubVideoTrack()`** — canvas 640×480 с текстом «Без видео», 30 fps.
6. Return объединённый `MediaStream([...audioTracks, ...videoTracks])`.

### Stub video (важно для SIP)

Canvas создаётся скрытым в DOM (`#fixed-wrapper`), рисуется в цикле каждые 150 ms, `captureStream(30)`.

**Зачем:** сохранить video m-line в SDP даже при отсутствии физической камеры — удалённая сторона видит «чёрный кадр с надписью», а не отсутствие видео-секции.

### `checkMediaAvailable(audioOnly?)`

Probe через `getUserMedia` mic + (если не audioOnly) camera, затем **stop всех tracks**. Возвращает `{ audio: bool, video: bool }`. Используется перед каждым call/answer/refer.

### Stream cache

`window.mediaStreamCache` — массив streams для cleanup при logout (`clearStreamCache()` → `destroyStream` на каждом).

---

## 4. Жизненный цикл видеозвонка

### 4.1 Исходящий вызов

**`store/UserAgent/actions.ts` → `Call(number)`:**

1. `forceAudioOnly = isExternalNumber(number)` — внешние номера без видео.
2. `audioOnly = settings.audioOnly || NoGUIMode || forceAudioOnly`.
3. `newConstraints = await checkMediaAvailable(audioOnly)`.
4. Если `!newConstraints.video` → `dispatch(setNoCamera(true))`.
5. `mediaStream = await getLocalMediaStream({ audioOnly, selectedAudioDevice, selectedVideoDevice })`.
6. `UserAgentInstance.call(uri, { mediaStream, mediaConstraints: newConstraints })`.

Video track в stream по умолчанию **muted** (`initialVideoMute = true`).

### 4.2 Входящий вызов

1. JsSIP `newRTCSession` → `SessionInitialize(key, Session)`.
2. `RTCSessionHandler` монтируется, показывает modal «Принять/Отклонить».
3. **Answer:** `getLocalMediaStream(...)` + `session.answer({ mediaConstraints, mediaStream })`.
4. `mediaConstraints = { audio: true, video: VideoEnabled }`, где `VideoEnabled = !audioOnly && !NoGUIMode`.

### 4.3 Peer connection и remote tracks

**`SetSessionMedia(key, Session)`** в `store/Sessions/actions.ts`:

```typescript
Session.connection?.addEventListener("track", (e) => {
  setTimeout(() => {
    dispatch(setSessionRemoteStreams({ key, track: e.track }));
  }, 0);
});
```

Reducer создаёт **отдельный** `MediaStream` на каждый track:
- `video` → `SessionRemoteVideoStreams[key]`
- `audio` → `SessionRemoteAudioStreams[key]`

Слушатель вешается на `peerconnection` и `connecting`, если media ещё не установлено.

### 4.4 Подтверждение соединения (`confirmed`)

**В `SessionInitialize`:**

1. Если `audioOnly || NoGUIMode` → `Session.sendInfo("text/plain", "no-video-remote")` — сигнал удалённой стороне.
2. Meta: `status: "confirmed"`, `startTime`, `showModal: false`.
3. `setSessionActive`, `setSessionDTMF`.

**В `RTCSessionHandler` (критичный workaround):**

```typescript
// Через 250 ms после confirmed:
changeStreamSource("camera").then(() => {
  if (!noCamera) sessionControl("cam-off");  // видео выключено по умолчанию
  setStreamsInitiated(true);
});
```

**Зачем 250 ms delay:** фикс ~15% случаев, когда remote video не отображается при старте.

**Политика по умолчанию:** после connect камера **принудительно инициализируется**, затем **сразу выключается** (если камера доступна). Пользователь видит avatar placeholder до явного включения cam.

### 4.5 Auto view mode при connect

При `status === "confirmed"`:

- Если номер содержит `vconf-sel` **и** `autoFullscreen` → `fullscreen`.
- Иначе если задан `defaultView` → применить его.

---

## 5. SIP / WebRTC / SDP

### Media constraints

Передаются в `UA.call()` / `session.answer()` как `mediaConstraints: { audio, video }` после probe.

JsSIP (`RTCSession.js`):
- Если `mediaConstraints.video === false` — video tracks удаляются из переданного stream.
- Если stream не передан — JsSIP сам вызывает `getUserMedia(mediaConstraints)`.

### SDP: определение «удалён без видео»

На событии `accepted`:

```typescript
const sdp = sdp_transform.parse(data.response.body);
const videoTracks = sdp.media.filter(m => m.type === "video");
const faultyVideoTracks = videoTracks.filter(m => !m.port);
const noVideo = !videoTracks.length || faultyVideoTracks.length;
if (noVideo) dispatch(setSessionMeta({ forceVideoDisable: true }));
```

### SIP INFO: `no-video-remote`

| Направление | Когда | Эффект |
|-------------|-------|--------|
| Исходящий | `confirmed`, если audio-only mode | `Session.sendInfo("no-video-remote")` |
| Входящий | `newInfo` body = `no-video-remote` | `forceVideoDisable: true` |

Константа: `store/Sessions/consts.ts` → `infoMessages.noVideo`.

**Важно:** `forceVideoDisable` передаётся в `SessionUI` как `remoteNoVideo`, но **в render не используется** — мёртвый prop.

### Refer / external numbers

- Refer на external → `mediaConstraints.video = false`.
- Исходящий на external → `forceAudioOnly` в `Call()`.

### Codecs

- `RTCRtpSender.getCapabilities("video")` — список из браузера.
- Пользователь выбирает и упорядочивает в `settings/Codecs.tsx` (drag-and-drop).
- `UA.set("preferred_codecs", { audio, video })` при изменении настроек.

### Renegotiation

`RTCSession.renegotiate()` существует в JsSIP, но **из UI не вызывается** ни для screen share, ни для mute rework. Всё через `replaceTrack`.

### Hold

JsSIP hold меняет SDP direction (`sendrecv` → `recvonly` → `inactive`) для audio **и** video. UI блокирует video controls при hold.

---

## 6. Redux state и события

### Sessions slice

| Ключ | Тип | Назначение |
|------|-----|------------|
| `SessionLocalStreams[id]` | `MediaStream` | Локальное видео для preview |
| `SessionRemoteVideoStreams[id]` | `MediaStream` | Remote video (1 track) |
| `SessionRemoteAudioStreams[id]` | `MediaStream` | Remote audio |
| `SessionMetas[id].isMuted` | `{ audio, video }` | UI mute state |
| `SessionMetas[id].mediaStreamSource` | `"camera" \| "screen"` | Текущий источник исходящего video |
| `SessionMetas[id].forceVideoDisable` | `boolean` | Remote declared no video |
| `SessionMetas[id].status` | SessionStates | Lifecycle |
| `SessionMetas[id].onHold` | HoldStates | Hold originator |

При `setSessionLocalStream` — предыдущий stream **destroy** через `destroyStream()`.

### UI slice

| Getter | Формула | Эффект |
|--------|---------|--------|
| `getVideoEnabled` | `!audioOnly && !NoGUIMode` | Видео-фичи доступны |
| `getNoCamera` | `state.ui.NoCamera` | Камера недоступна при probe |
| `getSessionView` | `minified \| expanded \| fullscreen` | Текущий layout |

`NoCamera` выставляется при incoming/outgoing если `checkMediaAvailable` вернул `video: false`. **Не** переключает автоматически `audioOnly` (закомментировано).

### UserAgent settings (localStorage `JSSIP_UA_USER_SETTINGS`)

- `selectedVideoDevice`, `selectedAudioDevice`
- `audioOnly`, `defaultView`, `autoFullscreen`
- `codecs.video[]` — приоритет и selection

---

## 7. UI: отображение видео

### Portal-архитектура (`react-reverse-portal`)

`SessionUI` создаёт **два** portal node (local + remote). `<video>` elements живут в `InPortal`, отображаются через `OutPortal` в layout-контейнерах.

```tsx
<InPortal node={localPortalNode}>
  <VideoFrameComponent outerRef={localRef} id={id} />
</InPortal>
<InPortal node={remotePortalNode}>
  <VideoFrameComponent outerRef={remoteRef} id={id} remote />
</InPortal>
```

**Зачем portals:** один `<video>` element переиспользуется при смене режима без remount и потери stream binding.

### Привязка streams

`useEffect` на `remoteStream` / `localStream`:
- Если `srcObject.id !== stream.id` → `element.srcObject = stream`.

### Placeholder (avatar)

`showVideoStreamPlaceholder = true` если **любое** из:
- `!videoOptionEnabled` (audio-only / NoGUI)
- `!videoCameraAvailable` (NoCamera)
- `!isThereRemoteVideo` (нет enabled video tracks у remote)

`isThereRemoteVideo = remoteStream.getVideoTracks().some(t => t.enabled)`.

Пока `streamsInitiated === false` — текст «Загрузка...».

### CSS mute indicator

Контейнер `.user-stream` получает класс `video-muted` когда `muted.video === true`.

### Скрытые refs в RTCSessionHandler

`RefsAcc` — скрытые `<video>`/`<audio>` (overflow hidden). **Audio** привязан к remote audio stream. Video refs в handler **не используются** для основного UI (legacy).

---

## 8. Режимы отображения (SessionView)

Тип: `"minified" | "expanded" | "fullscreen"`.

| Режим | UI label | Layout |
|-------|----------|--------|
| `minified` | «Телефон» | Компактные кнопки в portal `#session-{id}` в основной панели |
| `expanded` | «Картинка в картинке» | Floating panel ~360px, draggable (`UAWrapper` → `#expanded-tabs`, `#expanded-content`) |
| `fullscreen` | «Телеконференция» | Full-viewport: video слева + боковая панель 440px (numpad и т.д.) |

**Не browser Picture-in-Picture API** — «PiP» = custom floating `expanded` panel.

### Дополнительно: browser fullscreen

Отдельно от `SessionView.fullscreen`:
- `document.getElementById("fullscreen-content").requestFullscreen()`
- Кнопки enter/exit fullscreen только в layout mode `fullscreen`.
- При смене `SessionView` → `exitFullscreen()` browser API.

### Local preview size

| SessionView | Размер local PiP |
|-------------|------------------|
| `fullscreen` | 240×180 px |
| `expanded` / другие | 120×90 px |

---

## 9. Переключение режимов UI

### SelectViewButton (`SelectView.tsx`)

Dropdown с тремя режимами + checkmark на текущем. Icons: `table`, `previewmode`, `telephone`.

### UIActionHandler (`RTCSessionHandler`)

```typescript
case "view":
  setFullscreen(false);           // exit browser fullscreen
  dispatch(setSessionView(value));
```

### Когда доступен переключатель

- `minified` controls: cam, mic, hold, transfer, **view switch**
- `expanded` controls: cam, mic, terminate, **view switch**
- `fullscreen` controls: screen share, cam, mic, terminate, browser FS, **view switch**, collapse panel

### Auto-selection при connect

См. §4.5 — `vconf-sel` + `autoFullscreen`, иначе `defaultView` из settings.

### Multi-session

В `expanded`/`fullscreen` — tabs (`#expanded-tabs`, `#fullscreen-tabs`). Активная сессия рендерит content в соответствующий portal. `setActive(id)` переключает вкладку.

---

## 10. Локальный превью (PiP)

`LocalStreamPreview` + `LocalStreamUI`:

- Toggle `showLocalStream` — показать/скрыть своё видео поверх remote.
- `LocalStreamUI` — кнопка «Показать мою веб-камеру».
- Рендерится внутри `renderVideoStream()` независимо от remote placeholder logic.

**Закомментированный код** в `SessionUI` ранее скрывал local preview при `!isThereRemoteVideo` — сейчас preview доступен шире.

---

## 11. Трансляция экрана (screen share)

### Доступность

- Кнопка screen share **только в `fullscreen` mode**.
- Toggle: `sessionAction("change-source")`.

### Логика (`changeVideoSource`)

**Screen:**

```typescript
const ScreenStream = await navigator.mediaDevices.getDisplayMedia({
  audio: false,
  video: true,
});
const ScreenVideoTrack = ScreenStream.getVideoTracks()[0];
videoSender.replaceTrack(ScreenVideoTrack);
// meta: mediaStreamSource = "screen"
// Redux: SessionLocalStream = new MediaStream([ScreenVideoTrack])
```

**Camera (возврат):**

```typescript
const CameraStream = await getLocalMediaStream({ videoDeviceId });
const CameraVideoTrack = CameraStream.getVideoTracks()[0];
if (muteState.video) CameraVideoTrack.enabled = false;
videoSender.replaceTrack(CameraVideoTrack);
// meta: mediaStreamSource = "camera"
```

### UI при screen share

| Состояние | Кнопка | Cam on/off |
|-----------|--------|------------|
| `mediaStreamSource === "camera"` | «Трансляция экрана» (зелёная) | enabled |
| `mediaStreamSource === "screen"` | «Трансляция с камеры» (красная) | **disabled** |

Cam controls также disabled при: `!videoOptionEnabled`, `!videoCameraAvailable`, `hold`.

### SIP / WebRTC

- **Нет re-INVITE** — только `replaceTrack`.
- Constraints screen: `{ audio: false, video: true }` — без resolution/fps.
- **Нет `track.onended`** — если пользователь остановит share через OS, приложение **не узнает** и останется в state `screen`.

---

## 12. Video mute / source mute rework (OS-1509)

### Проблема до rework

JsSIP `Session.mute({ video: true })` → `_toggleMuteVideo()` → только `sender.track.enabled = false`. Это не всегда корректно работало с заменой источника и UI state.

### Новый UI path (`setVideoMute` / `setAudioMute`)

**Алгоритм video mute:**

1. Найти `RTCRtpSender` с `track.kind === "video"`.
2. `getLocalMediaStream({ videoDeviceId })` — **новый** stream.
3. `VideoTrack.enabled = false/true`.
4. `videoSender.replaceTrack(VideoTrack)`.
5. Redux: `isMuted.video`, `SessionLocalStream`, при unmute — `mediaStreamSource: "camera"`.

**Аналогично для audio** с `audioDeviceId`.

### Маппинг UI actions

| Action | Handler |
|--------|---------|
| `cam-off` | `setVideoMute(true)` |
| `cam-on` | `setVideoMute(false)` |
| `mic-off` | `setAudioMute(true)` |
| `mic-on` | `setAudioMute(false)` |

### Старый path (external API)

`globals/adapter.ts` → `muteToggle(callid, "video")`:

```typescript
Session.mute({ audio: false, video: true })
Session.unmute({ audio: false, video: true })
// + sync Redux isMuted
```

**Рассинхрон:** UI path не обновляет `Session._videoMuted` JsSIP. External API path не делает `replaceTrack`. Два независимых механизма.

### JsSIP internal (для справки)

```javascript
_toggleMuteVideo(mute) {
  const senders = this._connection.getSenders().filter(s => s.track?.kind === "video");
  for (const sender of senders) {
    sender.track.enabled = !mute;
  }
}
```

### Default outbound policy

1. `getLocalMediaStream` → `initialVideoMute: true`.
2. Post-connect → `changeStreamSource("camera")` → `cam-off` if camera available.
3. Итог: **исходящее видео выключено** до явного `cam-on`, но video m-line и track присутствуют.

---

## 13. Камера: выбор, настройка, подключение

### Enumeration (`GetAvailableDevicesList`)

1. `checkMediaAvailable()` — probe permissions.
2. `navigator.mediaDevices.enumerateDevices()`.
3. Фильтр `deviceId` ∈ `["default", "communications"]`.
4. Split: `audioInputs`, `videoInputs`.

**Нет `devicechange` listener** — список обновляется только при mount `SourceSelect`.

### UI выбора (`SourceSelect.tsx`)

- Два dropdown (mic / cam) через Tooltip + список устройств.
- «По умолчанию» = `selectedVideoDevice === undefined` → `{ video: true }`.
- Clear (×) → `onDeviceSelect(undefined, "video")`.
- При `audioOnly` — video dropdown disabled, preview показывает «Режим только аудио».

### Live preview (`VideoSourceView.tsx`)

При смене `deviceId`:

```typescript
getLocalMediaStream({
  audioOnly,
  videoDeviceId: newDeviceId,
  initialVideoMute: false,  // preview всегда с включённым video
  cacheStream: false,
});
```

Старый stream stops on cleanup.

### Persistence

`dispatch(setUserAgentSettings({ selectedVideoDevice: deviceId }))` → localStorage `JSSIP_UA_USER_SETTINGS`.

### Применение deviceId

Используется в:
- `Call()` / `answer()` / `refer-accept`
- `setVideoMute` / `setAudioMute`
- `changeVideoSource("camera")`
- `getLocalVideoStream()` при mount handler

### Hot-swap во время звонка

**Не реализован.** Смена камеры в settings во время active call **не** триггерит `replaceTrack`. Новый device применится при следующем `getLocalMediaStream` (cam-on, change-source→camera, следующий звонок).

### No camera path

1. `getUserMedia({ video })` fails → stub canvas track.
2. `setNoCamera(true)` при probe fail на call/incoming.
3. Post-connect **не** вызывает `cam-off` если `noCamera` — stub stream остаётся active.
4. Placeholder avatar показывается из-за `!videoCameraAvailable`.

---

## 14. Настройки пользователя

### Calls settings (`settings/Calls.tsx`)

| Setting | Key | Эффект на видео |
|---------|-----|-----------------|
| Режим «только аудио» | `audioOnly` | `VideoEnabled = false`, send INFO no-video |
| Полноэкранный в конференции | `autoFullscreen` | Auto `fullscreen` для `vconf-sel` |
| Режим отображения по умолчанию | `defaultView` | View при confirmed |
| Игнорировать auto-answer | `ignoreAutoAnswer` | Косвенно — modal vs auto answer |

### SourceSelect (вкладка устройств)

Дублирует `audioOnly` toggle + device pickers с preview.

### Codecs (`settings/Codecs.tsx`)

Video codecs: checkbox selection + drag order → `UA.preferred_codecs`.

### NoGUIMode (`adapter.noGUIMode()`)

Headless mode → `VideoEnabled = false`, как audio-only.

---

## 15. Внешний API (OKTELLPhone)

**Файл:** `globals/adapter.ts` → `window.OKTELLPhone`

| Метод | Видео-поведение |
|-------|-----------------|
| `call(number)` | Через Redux `Call()` — полный video pipeline |
| `answer(callid)` | `checkMediaAvailable` + `answer({ mediaConstraints })` |
| `muteToggle(callid, "video")` | JsSIP `mute/unmute` — **не** OS-1509 rework path |
| `holdToggle(callid)` | Hold audio+video SDP |
| `noGUIMode(bool)` | Отключает video |

---

## 16. Edge cases и известные пробелы

| Сценарий | Поведение | Пробел |
|----------|-----------|--------|
| Mic permission denied | Alert, call aborted | — |
| Camera permission denied | Stub track, `NoCamera=true`, без alert | User может не понять почему avatar |
| Remote без video (SDP) | `forceVideoDisable` | **Prop не используется в UI** |
| Remote SIP INFO no-video | `forceVideoDisable` | То же |
| Hold local/remote | Video controls disabled | — |
| Screen share stopped в OS | State остаётся `screen` | **Нет `onended` handler** |
| Camera unplugged mid-call | Старый track | **Нет `devicechange`** |
| Video не показывается ~15% | 250ms workaround | Хак, не root cause fix |
| External / refer numbers | `video: false` | — |
| `vconf-sel` conference | Auto fullscreen | Hardcoded substring |
| Memory leaks | `mediaStreamCache` + destroy on replace | Зависит от корректного cleanup |
| Dual mute paths | UI vs API | **Рассинхрон state** |
| `remoteNoVideo` prop | Passed, unused | Dead code |
| Mid-call device change | Не применяется | Feature gap |

---

## 17. Диаграммы потоков

### Исходящий video call

```
User clicks Call
  → checkMediaAvailable()
  → getLocalMediaStream(initialVideoMute=true)
  → UA.call({ mediaStream, mediaConstraints })
  → peerconnection track events
  → SetSessionMedia → remote streams в Redux
  → confirmed event
  → [250ms] changeStreamSource("camera") → cam-off
  → streamsInitiated=true, UI shows placeholder/remote
```

### Cam on (OS-1509)

```
User clicks cam-on
  → setVideoMute(false)
  → getLocalMediaStream()
  → track.enabled = true
  → sender.replaceTrack(track)
  → Redux: isMuted.video=false, localStream updated
  → SessionUI: placeholder off if remote video exists
```

### Screen share toggle

```
User in fullscreen clicks screen
  → change-source
  → getDisplayMedia() OR getLocalMediaStream()
  → replaceTrack
  → Redux: mediaStreamSource, localStream
  → cam controls disabled if screen
```

### View mode switch

```
User selects view in SelectViewButton
  → UIAction("view", mode)
  → exitFullscreen() browser
  → setSessionView(mode)
  → SessionUI renderExpanded/Fullscreen/Minified
  → OutPortal re-targets same <video> elements
```

---

## 18. Реализованные фичи

1. **Двусторонние видеозвонки** через WebRTC (audio + video m-lines).
2. **Исходящий и входящий** video с pre-built `MediaStream`.
3. **Три UI режима** сессии: minified, expanded (floating PiP), fullscreen (conference layout).
4. **Browser fullscreen** поверх conference layout.
5. **Remote video display** через portal-based `<video>` с autoPlay.
6. **Local video PiP** с toggle и адаптивным размером.
7. **Avatar placeholder** при отсутствии remote video / no camera / audio-only.
8. **Локальный video mute/unmute** (камера on/off) через OS-1509 `replaceTrack` rework.
9. **Локальный audio mute/unmute** через тот же rework pattern.
10. **Screen sharing** через `getDisplayMedia` + `replaceTrack` (fullscreen only).
11. **Переключение camera ↔ screen** одной кнопкой.
12. **Выбор камеры и микрофона** с live preview и persistence в localStorage.
13. **Режим «только аудио»** с SIP INFO сигнализацией `no-video-remote`.
14. **Stub video track** (canvas) при недоступной камере — сохранение video SDP.
15. **Определение remote no-video** из SDP (port=0 / нет m-line).
16. **Приём SIP INFO** `no-video-remote` от удалённой стороны.
17. **Video codec selection и priority** (browser capabilities + user order).
18. **Auto fullscreen** для conference numbers (`vconf-sel`).
19. **Default view mode** настройка при установлении соединения.
20. **Default outbound video muted** после connect (privacy-by-default).
21. **Post-connect video init workaround** (250ms camera rebind).
22. **Hold** с блокировкой video controls.
23. **Multi-session tabs** в expanded/fullscreen с переключением active call.
24. **External API** `muteToggle`, `call`, `answer`, `noGUIMode`.
25. **NoGUI / headless** режим без видео.
26. **External numbers** — принудительный audio-only.
27. **Refer** с отключением video для external targets.
28. **Stream lifecycle management** — cache, destroy on replace, clear on logout.
29. **Device enumeration** с permission probe и фильтрацией pseudo-devices.
30. **Loading state** («Загрузка...») до `streamsInitiated`.

---

## 19. Плюсы и минусы реализации

### Плюсы

1. **OS-1509 replaceTrack rework** — надёжнее простого `track.enabled` при смене источника и повторном захвате камеры.
2. **Portal-архитектура** — один video element на local/remote без remount при смене layout; плавное переключение режимов.
3. **Stub video track** — элегантное решение для сохранения video m-line при отсутствии камеры; не ломает SDP negotiation.
4. **Privacy-by-default** — исходящее видео выключено после connect; пользователь явно включает камеру.
5. **SIP INFO + SDP parsing** — двойной механизм определения audio-only remote party.
6. **Разделение audio/video remote streams** — независимая привязка к `<audio>` и `<video>`.
7. **Screen share без re-INVITE** — быстрое переключение через `replaceTrack`, меньше SIP churn.
8. **Настраиваемые codecs** — пользовательский контроль приоритета VP8/VP9/H264.
9. **Conference UX** — auto fullscreen + dedicated layout с боковой панелью.
10. **Device preview в settings** — пользователь видит камеру до звонка.
11. **Stream cache + destroy** — осознанная попытка управлять lifecycle MediaStream.
12. **Рабочий workaround** для flaky remote video на старте (250ms rebind).

### Минусы

1. **Два пути mute** (UI replaceTrack vs API Session.mute) — рассинхрон Redux и JsSIP internal `_videoMuted`.
2. **`forceVideoDisable` / `remoteNoVideo` не используется в UI** — логика определения remote no-video не влияет на отображение.
3. **Нет `devicechange` handler** — отключение камеры mid-call не обрабатывается.
4. **Нет `track.onended` для screen share** — OS-level stop share оставляет stale state `mediaStreamSource: "screen"`.
5. **Нет hot-swap камеры во время звонка** — смена в settings не применяется до следующего media operation.
6. **Нет SIP renegotiation** при screen share — может ломаться с некоторыми SFU/MCU, если ожидают new SDP.
7. **250ms post-connect hack** — симптом, не исправление root cause flaky video.
8. **`getLocalMediaStream` при каждом mute/unmute** — новый gUM call; overhead, возможен flash permission indicator.
9. **Monolithic architecture** — video logic в React handler, не выделена в domain/service; сложно тестировать и переносить.
10. **Redux хранит live MediaStream** — антипаттерн для serializable state; риск stale references.
11. **Hardcoded `vconf-sel` substring** — хрупкая эвристика conference detection.
12. **`checkMediaAvailable` alert на mic fail** — блокирующий UX; camera fail только console.warn.
13. **Screen share только в fullscreen** — нет share из minified/expanded.
14. **getDisplayMedia без audio** — нельзя транслировать system audio (tab audio).
15. **No resolution/fps constraints** — нет адаптации качества под bandwidth.
16. **Закомментированный / мёртвый код** — `remoteNoVideo`, старый LocalStreamWrapper condition, hidden video refs.
17. **Type safety gaps** — `@ts-ignore` на getDisplayMedia, `(Session as any)._videoMuted`.
18. **Нет recovery** при `replaceTrack` failure — silent return если sender не найден.
19. **Placeholder logic** требует remote video enabled — local-only video call UX ограничен.
20. **Tight coupling UI ↔ WebRTC** — `RTCSessionHandler` напрямую вызывает gUM/replaceTrack; нарушает layering для Axatalk migration.

---

## Рекомендации для Axatalk migration

При переносе в `softphone-electron` учитывать:

- Сохранить **поведенческую совместимость**: default muted outbound video, stub track, SIP INFO `no-video-remote`, три view modes.
- Исправить **известные пробелы**: единый mute path, `devicechange`, screen `onended`, использование `forceVideoDisable` в UI.
- Разместить media orchestration в **Application + Media adapter**, не в React components (Architecture Constitution).
- Заменить Redux MediaStream на **ports/projections** (Zustand projections only).

---

*Документ создан в ветке `video-integration` репозитория `softphone-electron` на основе статического анализа legacy oktell-softphone OS-1509.*

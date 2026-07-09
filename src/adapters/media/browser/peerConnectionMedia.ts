/**
 * - Purpose: bind remote WebRTC audio and toggle local senders on a peer connection.
 * - Inputs: opaque peer connection, HTML audio element, mute enabled flag.
 * - Outputs: wired playback or mute state change indicator.
 */

type RtcAudioSender = Readonly<{
  track: MediaStreamTrack | null;
}>;

type RtcAudioReceiver = Readonly<{
  track: MediaStreamTrack | null;
}>;

type RtcPeerConnectionLike = Readonly<{
  getSenders: () => ReadonlyArray<RtcAudioSender>;
  getReceivers: () => ReadonlyArray<RtcAudioReceiver>;
  addEventListener: (type: string, listener: (event: RtcTrackEventLike) => void) => void;
}>;

type RtcTrackEventLike = Readonly<{
  track: MediaStreamTrack;
  streams: ReadonlyArray<MediaStream>;
}>;

export function isRtcPeerConnectionLike(value: unknown): value is RtcPeerConnectionLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { getSenders?: unknown; getReceivers?: unknown };
  return (
    typeof candidate.getSenders === "function" &&
    typeof candidate.getReceivers === "function"
  );
}

export function wirePeerConnectionRemoteAudio(
  connection: unknown,
  audioElement: HTMLAudioElement,
): boolean {
  if (!isRtcPeerConnectionLike(connection)) {
    return false;
  }

  attachExistingReceiverTracks(connection, audioElement);

  connection.addEventListener("track", (event: RtcTrackEventLike): void => {
    if (event.streams.length > 0) {
      audioElement.srcObject = event.streams[0] ?? null;
    } else {
      const currentStream =
        audioElement.srcObject instanceof MediaStream
          ? audioElement.srcObject
          : new MediaStream();
      currentStream.addTrack(event.track);
      audioElement.srcObject = currentStream;
    }

    void audioElement.play().catch(() => undefined);
  });

  return true;
}

export function setLocalAudioTracksEnabled(connection: unknown, enabled: boolean): boolean {
  if (!isRtcPeerConnectionLike(connection)) {
    return false;
  }

  let changed = false;
  for (const sender of connection.getSenders()) {
    const track = sender.track;
    if (track !== null && track.kind === "audio") {
      track.enabled = enabled;
      changed = true;
    }
  }

  return changed;
}

function attachExistingReceiverTracks(
  connection: RtcPeerConnectionLike,
  audioElement: HTMLAudioElement,
): void {
  const stream = new MediaStream();
  for (const receiver of connection.getReceivers()) {
    const track = receiver.track;
    if (track !== null && track.kind === "audio") {
      stream.addTrack(track);
    }
  }

  if (stream.getTracks().length === 0) {
    return;
  }

  audioElement.srcObject = stream;
  void audioElement.play().catch(() => undefined);
}

export function wirePeerConnectionRemoteVideo(
  connection: unknown,
  videoElement: HTMLVideoElement,
): boolean {
  if (!isRtcPeerConnectionLike(connection)) {
    return false;
  }

  attachExistingRemoteVideoTracks(connection, videoElement);

  connection.addEventListener("track", (event: RtcTrackEventLike): void => {
    if (event.track.kind !== "video") {
      return;
    }
    if (event.streams.length > 0) {
      videoElement.srcObject = event.streams[0] ?? null;
    } else {
      const currentStream =
        videoElement.srcObject instanceof MediaStream
          ? videoElement.srcObject
          : new MediaStream();
      currentStream.addTrack(event.track);
      videoElement.srcObject = currentStream;
    }
    void videoElement.play().catch(() => undefined);
  });

  return true;
}

export function bindLocalVideoPreview(
  stream: MediaStream | null,
  videoElement: HTMLVideoElement,
): void {
  if (stream === null) {
    videoElement.srcObject = null;
    return;
  }
  const preview = new MediaStream(stream.getVideoTracks());
  videoElement.srcObject = preview.getVideoTracks().length > 0 ? preview : null;
  void videoElement.play().catch(() => undefined);
}

function attachExistingRemoteVideoTracks(
  connection: RtcPeerConnectionLike,
  videoElement: HTMLVideoElement,
): void {
  const stream = new MediaStream();
  for (const receiver of connection.getReceivers()) {
    const track = receiver.track;
    if (track !== null && track.kind === "video") {
      stream.addTrack(track);
    }
  }
  if (stream.getTracks().length === 0) {
    return;
  }
  videoElement.srcObject = stream;
  void videoElement.play().catch(() => undefined);
}

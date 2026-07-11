/**
 * - Purpose: replace outbound video sender track on a peer connection.
 * - Inputs: opaque peer connection and next video track.
 * - Outputs: true when a video sender was updated.
 */

type RtcVideoSender = {
  track: MediaStreamTrack | null;
  replaceTrack: (track: MediaStreamTrack | null) => Promise<void>;
};

type RtcRtpTransceiverLike = Readonly<{
  sender: RtcVideoSender;
  receiver: Readonly<{ track: MediaStreamTrack | null }>;
}>;

type RtcPeerConnectionLike = Readonly<{
  getSenders: () => ReadonlyArray<RtcVideoSender>;
  getTransceivers?: () => ReadonlyArray<RtcRtpTransceiverLike>;
}>;

export function isRtcPeerConnectionWithReplaceTrack(
  value: unknown,
): value is RtcPeerConnectionLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { getSenders?: unknown };
  return typeof candidate.getSenders === "function";
}

function resolveVideoSender(connection: RtcPeerConnectionLike): RtcVideoSender | null {
  const senders = connection.getSenders();
  const explicitVideo = senders.find((sender) => sender.track?.kind === "video");
  if (explicitVideo !== undefined) {
    return explicitVideo;
  }

  if (typeof connection.getTransceivers === "function") {
    const videoTransceiver = connection.getTransceivers().find((transceiver) => {
      return (
        transceiver.sender.track?.kind === "video" ||
        transceiver.receiver.track?.kind === "video"
      );
    });
    if (videoTransceiver !== undefined) {
      return videoTransceiver.sender;
    }
  }

  // Privacy-muted / renegotiated video often leaves sender.track === null.
  // Prefer the sole null-track sender when an audio sender already exists.
  const nullTrackSenders = senders.filter((sender) => sender.track === null);
  const hasAudioSender = senders.some((sender) => sender.track?.kind === "audio");
  if (nullTrackSenders.length === 1 && hasAudioSender) {
    return nullTrackSenders[0] ?? null;
  }

  return null;
}

/**
 * - Purpose: read current outbound video sender track without replacing.
 * - Inputs: opaque peer connection.
 * - Outputs: sender track or null when no video sender.
 */
export function resolveOutboundVideoSenderTrack(
  connection: unknown,
): MediaStreamTrack | null {
  if (!isRtcPeerConnectionWithReplaceTrack(connection)) {
    return null;
  }
  return resolveVideoSender(connection)?.track ?? null;
}

/**
 * - Purpose: detect stream vs RTCRtpSender video track mismatch after answer.
 * - Inputs: peer connection and local stream video track.
 * - Outputs: true when sender already carries the same track object.
 */
export function isOutboundVideoSenderSynced(
  connection: unknown,
  localVideoTrack: MediaStreamTrack,
): boolean {
  const senderTrack = resolveOutboundVideoSenderTrack(connection);
  return senderTrack === localVideoTrack;
}

export async function replaceOutboundVideoSenderTrack(
  connection: unknown,
  nextTrack: MediaStreamTrack | null,
): Promise<RtcVideoSender | null> {
  if (!isRtcPeerConnectionWithReplaceTrack(connection)) {
    return null;
  }

  const target = resolveVideoSender(connection);
  if (target === null || typeof target.replaceTrack !== "function") {
    return null;
  }

  await target.replaceTrack(nextTrack);
  return target;
}

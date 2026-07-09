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

export async function replaceOutboundVideoSenderTrack(
  connection: unknown,
  nextTrack: MediaStreamTrack | null,
): Promise<boolean> {
  if (!isRtcPeerConnectionWithReplaceTrack(connection)) {
    return false;
  }

  const target = resolveVideoSender(connection);
  if (target === null || typeof target.replaceTrack !== "function") {
    return false;
  }

  await target.replaceTrack(nextTrack);
  return true;
}

/**
 * - Purpose: replace outbound video sender track on a peer connection.
 * - Inputs: opaque peer connection and next video track.
 * - Outputs: true when a video sender was updated.
 */

type RtcVideoSender = {
  track: MediaStreamTrack | null;
  replaceTrack: (track: MediaStreamTrack | null) => Promise<void>;
};

type RtcPeerConnectionLike = Readonly<{
  getSenders: () => ReadonlyArray<RtcVideoSender>;
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

export async function replaceOutboundVideoSenderTrack(
  connection: unknown,
  nextTrack: MediaStreamTrack | null,
): Promise<boolean> {
  if (!isRtcPeerConnectionWithReplaceTrack(connection)) {
    return false;
  }

  const senders = connection.getSenders();
  const explicitVideo = senders.find((sender) => sender.track?.kind === "video");
  const target =
    explicitVideo ?? senders.find((sender) => typeof sender.replaceTrack === "function");

  if (target === undefined || typeof target.replaceTrack !== "function") {
    return false;
  }

  await target.replaceTrack(nextTrack);
  return true;
}

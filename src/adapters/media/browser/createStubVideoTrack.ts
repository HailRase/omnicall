/**
 * - Purpose: build a stub canvas video track when camera capture fails.
 * - Inputs: optional document for canvas creation.
 * - Outputs: MediaStreamTrack suitable for preserving SDP video m-line.
 */

export type CreateStubVideoTrackOptions = Readonly<{
  documentRef?: Document;
  label?: string;
  width?: number;
  height?: number;
  frameRate?: number;
}>;

type CanvasCaptureStream = {
  captureStream: (frameRate?: number) => MediaStream;
};

/**
 * - Purpose: create a looping canvas video track labeled as unavailable camera.
 * - Inputs: CreateStubVideoTrackOptions.
 * - Outputs: video MediaStreamTrack or null when DOM APIs unavailable.
 */
export function createStubVideoTrack(
  options: CreateStubVideoTrackOptions = {},
): MediaStreamTrack | null {
  const doc = options.documentRef ?? (typeof document !== "undefined" ? document : undefined);
  if (doc === undefined) {
    return null;
  }

  const width = options.width ?? 640;
  const height = options.height ?? 480;
  const frameRate = options.frameRate ?? 5;
  const label = options.label ?? "No camera";

  const canvas = doc.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = "none";
  doc.body?.appendChild(canvas);

  const context = canvas.getContext("2d");
  if (context === null) {
    canvas.remove();
    return null;
  }

  const draw = (): void => {
    context.fillStyle = "#111111";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#eeeeee";
    context.font = "24px sans-serif";
    context.textAlign = "center";
    context.fillText(label, width / 2, height / 2);
  };
  draw();

  const captureCapable = canvas as HTMLCanvasElement & CanvasCaptureStream;
  if (typeof captureCapable.captureStream !== "function") {
    canvas.remove();
    return null;
  }

  const stream = captureCapable.captureStream(frameRate);
  const track = stream.getVideoTracks()[0] ?? null;
  if (track === null) {
    canvas.remove();
    return null;
  }

  const intervalId = setInterval(draw, 200);
  const stopOriginal = track.stop.bind(track);
  track.stop = (): void => {
    clearInterval(intervalId);
    canvas.remove();
    stopOriginal();
  };

  return track;
}

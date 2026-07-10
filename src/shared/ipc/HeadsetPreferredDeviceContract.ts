/**
 * - Purpose: validate IPC payload for headset preferred device sync to main.
 * - Inputs: unknown IPC payload.
 * - Outputs: { deviceId: string | null } or null when invalid.
 */

export type HeadsetSetPreferredDeviceIdPayload = Readonly<{
  deviceId: string | null;
}>;

export type HeadsetSetPreferredDeviceIdResponse = Readonly<{
  ok: boolean;
}>;

export function parseHeadsetSetPreferredDeviceIdPayload(
  payload: unknown,
): HeadsetSetPreferredDeviceIdPayload | null {
  if (payload === null || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const deviceId = record["deviceId"];
  if (deviceId !== null && typeof deviceId !== "string") {
    return null;
  }
  if (typeof deviceId === "string" && deviceId.trim().length === 0) {
    return null;
  }
  return { deviceId };
}

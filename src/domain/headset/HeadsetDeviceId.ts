export type HeadsetDeviceId = string & { readonly __brand: "HeadsetDeviceId" };

export function createHeadsetDeviceId(value: string): HeadsetDeviceId {
  return value as HeadsetDeviceId;
}

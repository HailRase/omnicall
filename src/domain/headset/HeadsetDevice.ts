import type { HeadsetConnectionState } from "./HeadsetConnectionState.js";
import type { HeadsetDeviceId } from "./HeadsetDeviceId.js";

export type HeadsetDevice = Readonly<{
  id: HeadsetDeviceId;
  vendorId: number;
  productId: number;
  productName: string;
  connectionState: HeadsetConnectionState;
}>;

import type { PlatformVersionResponse } from "./IpcChannels.js";
import type { AppShutdownPayload } from "./AppShutdownContract.js";

export type SoftphonePreloadApi = Readonly<{
  getPlatformVersion: () => Promise<PlatformVersionResponse>;
  onBeforeClose: (handler: (payload: AppShutdownPayload) => void) => () => void;
  acknowledgeShutdown: (correlationId: AppShutdownPayload["correlationId"]) => Promise<void>;
}>;

declare global {
  interface Window {
    softphone: SoftphonePreloadApi;
  }
}

export {};

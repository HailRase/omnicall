import type { PlatformVersionResponse } from "./IpcChannels.js";
import type { AppShutdownPayload } from "./AppShutdownContract.js";
import type { ShellWindowLayoutPayload } from "./ShellWindowLayoutContract.js";

export type SoftphonePreloadApi = Readonly<{
  getPlatformVersion: () => Promise<PlatformVersionResponse>;
  onBeforeClose: (handler: (payload: AppShutdownPayload) => void) => () => void;
  acknowledgeShutdown: (correlationId: AppShutdownPayload["correlationId"]) => Promise<void>;
  applyShellWindowLayout: (payload: ShellWindowLayoutPayload) => Promise<void>;
}>;

declare global {
  interface Window {
    softphone: SoftphonePreloadApi;
  }
}

export {};

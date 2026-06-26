export const IPC_CHANNELS = {
  platformGetVersion: "platform:get-version",
  appBeforeClose: "app:before-close",
  appAcknowledgeShutdown: "app:acknowledge-shutdown",
  shellApplyWindowLayout: "shell:apply-window-layout",
} as const;

export type IpcChannel =
  (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export type PlatformVersionResponse = Readonly<{
  version: string;
  name: string;
}>;

export type { AppShutdownPayload, AppShutdownAckPayload } from "./AppShutdownContract.js";

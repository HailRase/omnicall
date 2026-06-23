export const IPC_CHANNELS = {
  platformGetVersion: "platform:get-version",
} as const;

export type IpcChannel =
  (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export type PlatformVersionResponse = Readonly<{
  version: string;
  name: string;
}>;

export type HidTelephonyUpdate = Readonly<{
  hookSwitch?: boolean;
  phoneMute?: boolean;
  flash?: boolean;
  programmable?: boolean;
}>;

export type HidPhoneAction =
  | Readonly<{ type: "hook"; state: "off" | "on" }>
  | Readonly<{ type: "mute"; state: "muted" | "unmuted" }>
  | Readonly<{ type: "hold" }>;

export type HidLedState = Readonly<{
  mute: boolean;
  offHook: boolean;
  ringing: boolean;
}>;

export type HidMuteInputMode = "pulse" | "latch";

export type HidReportParser = Readonly<{
  vendor: string;
  supportsHold: boolean;
  /** pulse = press/release pair; latch = absolute phoneMute bit. */
  muteInputMode: HidMuteInputMode;
  parseUpdate: (reportId: number, data: DataView) => HidTelephonyUpdate | null;
}>;

export function isWebHidSupported(): boolean {
  return typeof navigator !== "undefined" && "hid" in navigator;
}

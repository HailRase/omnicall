export type HeadsetHardwareEvent = Readonly<
  | { type: "hookOff" }
  | { type: "hookOn" }
  | { type: "mutePressed" }
  | { type: "holdPressed" }
  | { type: "deviceError"; reason: string }
>;

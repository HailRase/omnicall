export type HeadsetCommandType =
  | "signalIncoming"
  | "signalOutgoing"
  | "answer"
  | "hangup"
  | "clearSignal"
  | "setMute"
  | "setHoldIndicator";

export type HeadsetCommand = Readonly<
  | { type: "signalIncoming" | "signalOutgoing" | "answer" | "hangup" | "clearSignal" }
  | { type: "setMute"; muted: boolean }
  | { type: "setHoldIndicator"; muted?: boolean }
>;

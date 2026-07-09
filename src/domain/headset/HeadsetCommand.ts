export type HeadsetCommandType =
  | "signalIncoming"
  | "signalOutgoing"
  | "answer"
  | "hangup"
  | "clearSignal"
  | "setMute"
  | "setHoldIndicator";

export type HeadsetCommand = Readonly<
  | { type: "signalIncoming" | "signalOutgoing" | "answer" | "hangup" | "clearSignal" | "setHoldIndicator" }
  | { type: "setMute"; muted: boolean }
>;

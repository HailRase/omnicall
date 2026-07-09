import type { HeadsetCommand } from "@domain/index.js";
import {
  syncLedAfterAnswer,
  syncLedAfterHangup,
  syncLedIncomingRing,
  syncLedMute,
  syncLedOnHold,
} from "./hidLedOutput.js";

export async function executeHeadsetCommand(
  device: HIDDevice,
  command: HeadsetCommand,
): Promise<boolean> {
  if (!device.opened) {
    return false;
  }

  switch (command.type) {
    case "signalIncoming":
      return syncLedIncomingRing(device);
    case "signalOutgoing":
    case "answer":
      return syncLedAfterAnswer(device);
    case "hangup":
    case "clearSignal":
      return syncLedAfterHangup(device);
    case "setHoldIndicator":
      return syncLedOnHold(device);
    case "setMute":
      return syncLedMute(device, command.muted);
    default:
      return false;
  }
}

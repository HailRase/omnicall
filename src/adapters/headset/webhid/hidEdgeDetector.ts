import type { HidPhoneAction, HidTelephonyUpdate } from "./hidTypes.js";

type HidTelephonyState = Readonly<{
  hookSwitch: boolean;
  phoneMute: boolean;
  flash: boolean;
  programmable: boolean;
}>;

const INITIAL_STATE: HidTelephonyState = {
  hookSwitch: false,
  phoneMute: false,
  flash: false,
  programmable: false,
};

function applyUpdate(
  state: HidTelephonyState,
  update: HidTelephonyUpdate,
): HidTelephonyState {
  return {
    hookSwitch: update.hookSwitch ?? state.hookSwitch,
    phoneMute: update.phoneMute ?? state.phoneMute,
    flash: update.flash ?? state.flash,
    programmable: update.programmable ?? state.programmable,
  };
}

export type HidEdgeDetector = Readonly<{
  detect: (update: HidTelephonyUpdate) => HidPhoneAction | null;
  syncState: (update: HidTelephonyUpdate) => void;
  reset: () => void;
  getState: () => HidTelephonyState;
}>;

export function createHidEdgeDetector(supportsHold = false): HidEdgeDetector {
  let state: HidTelephonyState = { ...INITIAL_STATE };

  return {
    detect(update: HidTelephonyUpdate): HidPhoneAction | null {
      const previous = { hookSwitch: state.hookSwitch, phoneMute: state.phoneMute };
      const next = applyUpdate(state, update);

      if (update.hookSwitch !== undefined && previous.hookSwitch !== next.hookSwitch) {
        state = next;
        return { type: "hook", state: next.hookSwitch ? "off" : "on" };
      }

      if (update.phoneMute !== undefined && previous.phoneMute !== next.phoneMute) {
        state = next;
        return { type: "mute", state: next.phoneMute ? "muted" : "unmuted" };
      }

      if (supportsHold) {
        const flashPressed = update.flash === true && !state.flash;
        const programmablePressed = update.programmable === true && !state.programmable;
        state = next;
        if (flashPressed || programmablePressed) {
          return { type: "hold" };
        }
        return null;
      }

      state = next;
      return null;
    },
    syncState(update: HidTelephonyUpdate): void {
      state = applyUpdate(state, update);
    },
    reset(): void {
      state = { ...INITIAL_STATE };
    },
    getState(): HidTelephonyState {
      return { ...state };
    },
  };
}

export function mapHidPhoneActionToHardwareEvent(
  action: HidPhoneAction,
): import("@domain/index.js").HeadsetHardwareEvent | null {
  if (action.type === "hook") {
    return action.state === "off" ? { type: "hookOff" } : { type: "hookOn" };
  }
  if (action.type === "mute") {
    // Emit both edges; forward policy toggles only on muted===true (jssip-phone).
    return { type: "muteChanged", muted: action.state === "muted" };
  }
  if (action.type === "hold") {
    return { type: "holdPressed" };
  }
  return null;
}

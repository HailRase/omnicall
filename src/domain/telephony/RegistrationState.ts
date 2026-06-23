export type RegistrationState =
  | "idle"
  | "registering"
  | "registered"
  | "failed";

export const REGISTRATION_STATES: ReadonlyArray<RegistrationState> = [
  "idle",
  "registering",
  "registered",
  "failed",
];

export type RegistrationTransitionResult =
  | Readonly<{ ok: true; state: RegistrationState }>
  | Readonly<{ ok: false; reason: string; state: RegistrationState }>;

export function initialRegistrationState(): RegistrationState {
  return "idle";
}

export function transitionRegistrationState(
  current: RegistrationState,
  event:
    | "registration_requested"
    | "registration_succeeded"
    | "registration_failed"
    | "unregister",
): RegistrationTransitionResult {
  switch (event) {
    case "registration_requested":
      if (current === "idle" || current === "failed" || current === "registered") {
        return { ok: true, state: "registering" };
      }
      return { ok: false, reason: "already_registering", state: current };

    case "registration_succeeded":
      if (current === "registering") {
        return { ok: true, state: "registered" };
      }
      return { ok: false, reason: "not_registering", state: current };

    case "registration_failed":
      if (current === "registering") {
        return { ok: true, state: "failed" };
      }
      return { ok: false, reason: "not_registering", state: current };

    case "unregister":
      return { ok: true, state: "idle" };
  }
}

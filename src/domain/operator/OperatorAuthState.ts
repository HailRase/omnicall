export type OperatorAuthState =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "failed";

export const OPERATOR_AUTH_STATES: ReadonlyArray<OperatorAuthState> = [
  "idle",
  "authenticating",
  "authenticated",
  "failed",
];

export type OperatorAuthTransitionResult =
  | Readonly<{ ok: true; state: OperatorAuthState }>
  | Readonly<{ ok: false; reason: string; state: OperatorAuthState }>;

export function initialOperatorAuthState(): OperatorAuthState {
  return "idle";
}

export function transitionOperatorAuthState(
  current: OperatorAuthState,
  event:
    | "auth_requested"
    | "auth_succeeded"
    | "auth_failed"
    | "reset",
): OperatorAuthTransitionResult {
  switch (event) {
    case "auth_requested":
      if (current === "idle" || current === "failed") {
        return { ok: true, state: "authenticating" };
      }
      return { ok: false, reason: "already_authenticating", state: current };

    case "auth_succeeded":
      if (current === "authenticating") {
        return { ok: true, state: "authenticated" };
      }
      return { ok: false, reason: "not_authenticating", state: current };

    case "auth_failed":
      if (current === "authenticating") {
        return { ok: true, state: "failed" };
      }
      return { ok: false, reason: "not_authenticating", state: current };

    case "reset":
      return { ok: true, state: "idle" };
  }
}

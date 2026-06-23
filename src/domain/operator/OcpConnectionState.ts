export type OcpConnectionState = "disconnected" | "connecting" | "connected";

export const OCP_CONNECTION_STATES: ReadonlyArray<OcpConnectionState> = [
  "disconnected",
  "connecting",
  "connected",
];

export type OcpConnectionTransitionResult =
  | Readonly<{ ok: true; state: OcpConnectionState }>
  | Readonly<{ ok: false; reason: string; state: OcpConnectionState }>;

export function initialOcpConnectionState(): OcpConnectionState {
  return "disconnected";
}

export function transitionOcpConnectionState(
  current: OcpConnectionState,
  event: "connect_requested" | "connected" | "disconnected",
): OcpConnectionTransitionResult {
  switch (event) {
    case "connect_requested":
      if (current === "disconnected" || current === "connected") {
        return { ok: true, state: "connecting" };
      }
      return { ok: false, reason: "already_connecting", state: current };

    case "connected":
      if (current === "connecting") {
        return { ok: true, state: "connected" };
      }
      return { ok: false, reason: "not_connecting", state: current };

    case "disconnected":
      return { ok: true, state: "disconnected" };
  }
}

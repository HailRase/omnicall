/**
 * - Purpose: canonical OCP operator status values and presentation metadata.
 * - Inputs: numeric status from OCP protocol or application commands.
 * - Outputs: typed OperatorStatus, busy/working sets, label and color keys.
 */

export const OperatorStatus = {
  READY: 1,
  RINGING: 2,
  RESERVED_TO_CALL: 3,
  TALKING: 4,
  POST_CALL_PROCESSING: 5,
  HOLD: 6,
  BREAK: 7,
  PREPARING_TO_WORK: 8,
  LOGOUT: 9,
  AUTH: 10,
  RECONNECTED: 11,
  DISCONNECTED: 12,
  NEW_USER: 13,
  PRE_CALL_PROCESSING: 14,
  CONNECTION: 15,
} as const;

export type OperatorStatus = (typeof OperatorStatus)[keyof typeof OperatorStatus];

export const OPERATOR_STATUSES = [
  OperatorStatus.READY,
  OperatorStatus.RINGING,
  OperatorStatus.RESERVED_TO_CALL,
  OperatorStatus.TALKING,
  OperatorStatus.POST_CALL_PROCESSING,
  OperatorStatus.HOLD,
  OperatorStatus.BREAK,
  OperatorStatus.PREPARING_TO_WORK,
  OperatorStatus.LOGOUT,
  OperatorStatus.AUTH,
  OperatorStatus.RECONNECTED,
  OperatorStatus.DISCONNECTED,
  OperatorStatus.NEW_USER,
  OperatorStatus.PRE_CALL_PROCESSING,
  OperatorStatus.CONNECTION,
] as const satisfies ReadonlyArray<OperatorStatus>;

export type OcpOperatorStatusLabelKey =
  | "ocp.operatorStatus.ready"
  | "ocp.operatorStatus.ringing"
  | "ocp.operatorStatus.reservedToCall"
  | "ocp.operatorStatus.talking"
  | "ocp.operatorStatus.postCallProcessing"
  | "ocp.operatorStatus.hold"
  | "ocp.operatorStatus.break"
  | "ocp.operatorStatus.preparingToWork"
  | "ocp.operatorStatus.logout"
  | "ocp.operatorStatus.auth"
  | "ocp.operatorStatus.reconnected"
  | "ocp.operatorStatus.disconnected"
  | "ocp.operatorStatus.newUser"
  | "ocp.operatorStatus.preCallProcessing"
  | "ocp.operatorStatus.connection";

export const OPERATOR_STATUS_LABEL_KEY: Readonly<
  Record<OperatorStatus, OcpOperatorStatusLabelKey>
> = {
  [OperatorStatus.READY]: "ocp.operatorStatus.ready",
  [OperatorStatus.RINGING]: "ocp.operatorStatus.ringing",
  [OperatorStatus.RESERVED_TO_CALL]: "ocp.operatorStatus.reservedToCall",
  [OperatorStatus.TALKING]: "ocp.operatorStatus.talking",
  [OperatorStatus.POST_CALL_PROCESSING]: "ocp.operatorStatus.postCallProcessing",
  [OperatorStatus.HOLD]: "ocp.operatorStatus.hold",
  [OperatorStatus.BREAK]: "ocp.operatorStatus.break",
  [OperatorStatus.PREPARING_TO_WORK]: "ocp.operatorStatus.preparingToWork",
  [OperatorStatus.LOGOUT]: "ocp.operatorStatus.logout",
  [OperatorStatus.AUTH]: "ocp.operatorStatus.auth",
  [OperatorStatus.RECONNECTED]: "ocp.operatorStatus.reconnected",
  [OperatorStatus.DISCONNECTED]: "ocp.operatorStatus.disconnected",
  [OperatorStatus.NEW_USER]: "ocp.operatorStatus.newUser",
  [OperatorStatus.PRE_CALL_PROCESSING]: "ocp.operatorStatus.preCallProcessing",
  [OperatorStatus.CONNECTION]: "ocp.operatorStatus.connection",
};

export const OPERATOR_STATUS_COLOR: Readonly<Record<OperatorStatus, string>> = {
  [OperatorStatus.READY]: "var(--ocp-status-ready)",
  [OperatorStatus.RINGING]: "var(--ocp-status-ringing)",
  [OperatorStatus.RESERVED_TO_CALL]: "var(--ocp-status-reserved-to-call)",
  [OperatorStatus.TALKING]: "var(--ocp-status-talking)",
  [OperatorStatus.POST_CALL_PROCESSING]: "var(--ocp-status-post-call-processing)",
  [OperatorStatus.HOLD]: "var(--ocp-status-hold)",
  [OperatorStatus.BREAK]: "var(--ocp-status-break)",
  [OperatorStatus.PREPARING_TO_WORK]: "var(--ocp-status-preparing-to-work)",
  [OperatorStatus.LOGOUT]: "var(--ocp-status-logout)",
  [OperatorStatus.AUTH]: "var(--ocp-status-auth)",
  [OperatorStatus.RECONNECTED]: "var(--ocp-status-reconnected)",
  [OperatorStatus.DISCONNECTED]: "var(--ocp-status-disconnected)",
  [OperatorStatus.NEW_USER]: "var(--ocp-status-new-user)",
  [OperatorStatus.PRE_CALL_PROCESSING]: "var(--ocp-status-pre-call-processing)",
  [OperatorStatus.CONNECTION]: "var(--ocp-status-connection)",
};

export const USER_STATUSES_BUSY: ReadonlySet<OperatorStatus> = new Set([
  OperatorStatus.RINGING,
  OperatorStatus.RESERVED_TO_CALL,
  OperatorStatus.TALKING,
  OperatorStatus.POST_CALL_PROCESSING,
  OperatorStatus.HOLD,
  OperatorStatus.PRE_CALL_PROCESSING,
  OperatorStatus.CONNECTION,
]);

export const USER_STATUSES_WORKING: ReadonlySet<OperatorStatus> = new Set([
  OperatorStatus.READY,
  ...USER_STATUSES_BUSY,
]);

const OPERATOR_STATUS_VALUES = new Set<number>(OPERATOR_STATUSES);

export function isOperatorStatus(value: unknown): value is OperatorStatus {
  return typeof value === "number" && OPERATOR_STATUS_VALUES.has(value);
}

export function parseOperatorStatus(value: unknown): OperatorStatus | null {
  return isOperatorStatus(value) ? value : null;
}

/**
 * OCP wire often sends `reason_id: null` for system statuses (READY, RINGING, …).
 * System status ids coincide with their canonical reason ids, so an omitted reason
 * resolves to the status value. Explicit finite reason ids are kept as-is.
 */
export function resolveOperatorReasonId(
  status: OperatorStatus,
  wireReasonId: number | null | undefined,
): number {
  if (
    wireReasonId === null ||
    wireReasonId === undefined ||
    !Number.isFinite(wireReasonId)
  ) {
    return status;
  }
  return wireReasonId;
}

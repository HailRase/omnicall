/**
 * Shell window raise IPC contract (ADR-0013 / telephony + SDK + OCP + F-034 actionable).
 */

export const SHELL_WINDOW_RAISE_REASONS = [
  "incoming_call",
  "outgoing_call",
  "ocp_campaign_offer",
  "sdk_origin_trust",
  "sdk_pairing",
  "sdk_activate_consent",
  "second_instance",
  "notification_actionable",
] as const;

export type ShellWindowRaiseReason = (typeof SHELL_WINDOW_RAISE_REASONS)[number];

export type ShellWindowRaisePayload = Readonly<{
  reason: ShellWindowRaiseReason;
  /** Stable id for edge dedupe (callId, pairingRequestId, …). */
  dedupeKey?: string;
}>;

export type ShellWindowRaiseResponse = Readonly<{
  ok: boolean;
  reason?: "not_ready" | "invalid_payload" | "duplicate";
}>;

export type ShellOperatorAttentionPayload = Readonly<{
  kind: "sdk_pairing" | "sdk_origin_trust";
}>;

export function parseShellWindowRaisePayload(
  value: unknown,
): ShellWindowRaisePayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const reason = candidate["reason"];
  if (
    typeof reason !== "string" ||
    !(SHELL_WINDOW_RAISE_REASONS as readonly string[]).includes(reason)
  ) {
    return null;
  }
  const dedupeKey = candidate["dedupeKey"];
  if (dedupeKey !== undefined && typeof dedupeKey !== "string") {
    return null;
  }
  if (dedupeKey === undefined) {
    return { reason: reason as ShellWindowRaiseReason };
  }
  return { reason: reason as ShellWindowRaiseReason, dedupeKey };
}

export function parseShellWindowRaiseResponse(
  value: unknown,
): ShellWindowRaiseResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate["ok"] !== "boolean") {
    return null;
  }
  const reason = candidate["reason"];
  if (reason !== undefined && typeof reason !== "string") {
    return null;
  }
  if (reason === undefined) {
    return { ok: candidate["ok"] };
  }
  if (
    reason !== "not_ready" &&
    reason !== "invalid_payload" &&
    reason !== "duplicate"
  ) {
    return null;
  }
  return { ok: candidate["ok"], reason };
}

export function parseShellOperatorAttentionPayload(
  value: unknown,
): ShellOperatorAttentionPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const kind = (value as Record<string, unknown>)["kind"];
  if (kind !== "sdk_pairing" && kind !== "sdk_origin_trust") {
    return null;
  }
  return { kind };
}

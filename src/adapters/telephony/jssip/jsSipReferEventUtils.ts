/**
 * - Purpose: normalize JsSIP ReferSubscriber failure payloads at adapter boundary.
 * - Inputs: unknown REFER requestFailed or NOTIFY failed event payloads.
 * - Outputs: classified failure kinds and user-visible reason strings.
 */
export type ReferNotifyFailureKind =
  | "transfer_target_canceled"
  | "transfer_target_busy"
  | "transfer_target_declined"
  | "transfer_target_not_found"
  | "transfer_target_unavailable"
  | "refer_notify_failed";

export function extractReferNotifyStatusCode(event: unknown): number | null {
  if (typeof event !== "object" || event === null) {
    return null;
  }

  const statusLine = (event as { status_line?: { status_code?: unknown } }).status_line;
  if (statusLine === undefined || typeof statusLine.status_code !== "number") {
    return null;
  }

  return statusLine.status_code;
}

export function classifyReferNotifyFailure(event: unknown): ReferNotifyFailureKind {
  const statusCode = extractReferNotifyStatusCode(event);
  if (statusCode === null) {
    return "refer_notify_failed";
  }

  if (statusCode === 487) {
    return "transfer_target_canceled";
  }
  if (statusCode === 486 || statusCode === 600) {
    return "transfer_target_busy";
  }
  if (statusCode === 603) {
    return "transfer_target_declined";
  }
  if (statusCode === 404 || statusCode === 410) {
    return "transfer_target_not_found";
  }
  if (statusCode === 408 || statusCode === 480 || statusCode === 503) {
    return "transfer_target_unavailable";
  }

  return "refer_notify_failed";
}

export function referNotifyFailureUserMessage(
  kind: ReferNotifyFailureKind,
  event: unknown,
): string {
  switch (kind) {
    case "transfer_target_canceled":
      return "Transfer target canceled or did not answer";
    case "transfer_target_busy":
      return "Transfer target is busy";
    case "transfer_target_declined":
      return "Transfer target declined the call";
    case "transfer_target_not_found":
      return "Transfer target not found";
    case "transfer_target_unavailable":
      return "Transfer target is unavailable";
    case "refer_notify_failed":
      return `Transfer failed: ${formatReferFailure(event)}`;
  }
}

export function formatReferRequestFailure(event: unknown): string {
  if (typeof event !== "object" || event === null) {
    return "refer_rejected";
  }

  const cause = (event as { cause?: unknown }).cause;
  if (typeof cause === "string" && cause.length > 0) {
    return cause;
  }

  const response = (event as { response?: { status_code?: unknown; reason_phrase?: unknown } })
    .response;
  if (response !== undefined && typeof response.status_code === "number") {
    const phrase =
      typeof response.reason_phrase === "string" ? response.reason_phrase : "";
    return phrase.length > 0
      ? `SIP ${response.status_code} ${phrase}`
      : `SIP ${response.status_code}`;
  }

  return "refer_rejected";
}

export function formatReferFailure(event: unknown): string {
  if (typeof event !== "object" || event === null) {
    return "refer_notify_failed";
  }

  const statusLine = (event as { status_line?: { status_code?: unknown; reason_phrase?: unknown } })
    .status_line;
  if (statusLine !== undefined && typeof statusLine.status_code === "number") {
    const phrase =
      typeof statusLine.reason_phrase === "string" ? statusLine.reason_phrase : "";
    return phrase.length > 0
      ? `SIP ${statusLine.status_code} ${phrase}`
      : `SIP ${statusLine.status_code}`;
  }

  return "refer_notify_failed";
}

export function mapReferNotifyFailureMessage(event: unknown): string {
  const kind = classifyReferNotifyFailure(event);
  return referNotifyFailureUserMessage(kind, event);
}

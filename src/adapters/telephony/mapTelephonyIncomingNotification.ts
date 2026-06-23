import { createCallId } from "@domain/index.js";
import type { TelephonyIncomingCallNotification } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { parseDisplayName } from "./parseDisplayName.js";

export type IncomingRawNotification = Readonly<{
  callId: string;
  fromHeader: unknown;
  remoteNumber: string;
  correlationId?: CorrelationId;
}>;

export function mapTelephonyIncomingNotification(
  raw: IncomingRawNotification,
): TelephonyIncomingCallNotification {
  const parsedIdentity = parseDisplayName(raw.fromHeader);
  const baseNotification = {
    callId: createCallId(raw.callId),
    remoteNumber:
      parsedIdentity.number !== null ? parsedIdentity.number : raw.remoteNumber,
    correlationId: raw.correlationId ?? createCorrelationId(),
  };
  if (parsedIdentity.displayName === null) {
    return baseNotification;
  }
  return {
    ...baseNotification,
    remoteDisplayNameRaw: parsedIdentity.displayName,
  };
}

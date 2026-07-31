/**
 * Map Application OCP reason projections → public SDK DTOs (ADR-0017 O-OCP-1).
 * Safe labels only — no OCP wire frames, channels, or apiKeys.
 */

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { OperatorStatusReason } from "@domain/integration/ocp/OperatorStatusReason.js";

import type {
  SdkOperatorReasonDto,
  SdkOperatorReasonKind,
} from "./ExternalSdkOperatorPort.js";

const LABEL_MAX = 128;

export type SdkOperatorReasonsProjection = Readonly<{
  readyReasons: ReadonlyArray<OperatorStatusReason>;
  breakReasons: ReadonlyArray<OperatorStatusReason>;
  logoutReasons: ReadonlyArray<OperatorStatusReason>;
}>;

export function mapSdkOperatorReasons(
  projection: SdkOperatorReasonsProjection,
): ReadonlyArray<SdkOperatorReasonDto> {
  return [
    ...projection.readyReasons.map((r) => toDto(r, "ready")),
    ...projection.breakReasons.map((r) => toDto(r, "break")),
    ...projection.logoutReasons.map((r) => toDto(r, "logout")),
  ];
}

export function filterSdkReasonsByKind(
  reasons: ReadonlyArray<SdkOperatorReasonDto>,
  kind: SdkOperatorReasonKind,
): ReadonlyArray<SdkOperatorReasonDto> {
  return reasons.filter((reason) => reason.kind === kind);
}

export function resolveSdkStatusReasonId(
  target: "ready" | "break",
  reasonId: number | undefined,
  reasons: ReadonlyArray<SdkOperatorReasonDto>,
): number | null {
  const kind: SdkOperatorReasonKind = target;
  if (reasonId !== undefined) {
    return reasons.some((r) => r.kind === kind && r.id === reasonId)
      ? reasonId
      : null;
  }
  if (target === "ready") {
    const ready = reasons.find(
      (r) => r.kind === "ready" && r.id === OperatorStatus.READY,
    );
    return ready?.id ?? OperatorStatus.READY;
  }
  return null;
}

function toDto(
  reason: OperatorStatusReason,
  kind: SdkOperatorReasonKind,
): SdkOperatorReasonDto {
  return {
    id: reason.id,
    label: reason.defaultDescription.slice(0, LABEL_MAX),
    kind,
  };
}

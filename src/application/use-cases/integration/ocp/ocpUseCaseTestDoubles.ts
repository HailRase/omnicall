import { createOperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import type { OperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { OperatorStatus as OperatorStatusType } from "@domain/integration/ocp/OperatorStatus.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import type { DndReadModel } from "@ports/settings/DndReadModel.js";

export class MockOcpOperatorReadModel implements OcpOperatorReadModel {
  constructor(
    private profile: OperatorProfile | null = null,
    private reservedStatus: OperatorStatusType | null = null,
    private reservedReasonId: number | null = null,
  ) {}

  getCurrentOperatorProfile(): OperatorProfile | null {
    return this.profile;
  }

  getReservedStatus(): OperatorStatusType | null {
    return this.reservedStatus;
  }

  getReservedReasonId(): number | null {
    return this.reservedReasonId;
  }

  setProfile(profile: OperatorProfile | null): void {
    this.profile = profile;
  }

  setReserved(
    reservedStatus: OperatorStatusType | null,
    reservedReasonId: number | null = null,
  ): void {
    this.reservedStatus = reservedStatus;
    this.reservedReasonId = reservedReasonId;
  }
}

export class MockDndReadModel implements DndReadModel {
  constructor(private enabled = false) {}

  isDndEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export function createReadyOperatorProfile(
  operatorId = 42,
): OperatorProfile {
  return createOperatorProfile({
    operatorId,
    status: OperatorStatus.READY,
    reasonId: 0,
    statusSince: new Date("2026-07-13T12:00:00.000Z"),
  });
}

export function createBusyOperatorProfile(
  status: OperatorStatusType = OperatorStatus.TALKING,
  operatorId = 42,
): OperatorProfile {
  return createOperatorProfile({
    operatorId,
    status,
    reasonId: 0,
    statusSince: new Date("2026-07-13T12:00:00.000Z"),
  });
}

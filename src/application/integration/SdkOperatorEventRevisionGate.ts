/**
 * Coarse-advance policy for public operator SDK events (DI-05 follow-up).
 * Advances session revision only on meaningful public operator changes.
 */

import type { WireJsonObject } from "@softomnitel/omnicall-protocol";

import type { SdkPublicEventDraft } from "./ExternalSdkEventMapper.js";
import type { SdkSessionRevisionCoordinator } from "./SdkSessionRevisionCoordinator.js";

export type SdkOperatorEventPublishResult = Readonly<{
  draft: SdkPublicEventDraft;
  revision: number;
  advanced: boolean;
}>;

type LastOperatorPublish = Readonly<{
  status: string | undefined;
  reasonId: number | undefined;
  connected: boolean | undefined;
  reservedTarget: string | undefined;
  reservedReasonId: number | undefined;
  campaignId: string | undefined;
}>;

function readPublicStatus(payload: WireJsonObject): string | undefined {
  const status = payload["status"];
  return typeof status === "string" ? status : undefined;
}

function readReasonId(payload: WireJsonObject): number | undefined {
  const reasonId = payload["reasonId"];
  return typeof reasonId === "number" &&
    Number.isInteger(reasonId) &&
    reasonId >= 0
    ? reasonId
    : undefined;
}

function readConnected(payload: WireJsonObject): boolean | undefined {
  const connected = payload["connected"];
  return typeof connected === "boolean" ? connected : undefined;
}

function readReservedTarget(payload: WireJsonObject): string | undefined {
  const reservedTarget = payload["reservedTarget"];
  return reservedTarget === "ready" || reservedTarget === "break"
    ? reservedTarget
    : undefined;
}

function readReservedReasonId(payload: WireJsonObject): number | undefined {
  const reservedReasonId = payload["reservedReasonId"];
  return typeof reservedReasonId === "number" &&
    Number.isInteger(reservedReasonId) &&
    reservedReasonId >= 0
    ? reservedReasonId
    : undefined;
}

function shouldAdvanceStatus(
  previous: LastOperatorPublish,
  nextStatus: string | undefined,
  nextReasonId: number | undefined,
  nextReservedTarget: string | undefined,
  nextReservedReasonId: number | undefined,
): boolean {
  if (nextStatus === undefined) {
    return false;
  }
  if (previous.status !== nextStatus) {
    return true;
  }
  if (
    (nextStatus === "ready" || nextStatus === "break") &&
    previous.reasonId !== nextReasonId
  ) {
    return true;
  }
  if (previous.reservedTarget !== nextReservedTarget) {
    return true;
  }
  if (
    nextReservedTarget !== undefined &&
    previous.reservedReasonId !== nextReservedReasonId
  ) {
    return true;
  }
  return false;
}

/**
 * Tracks last published operator public fields and applies coarse-advance.
 */
export class SdkOperatorEventRevisionGate {
  private last: LastOperatorPublish = {
    status: undefined,
    reasonId: undefined,
    connected: undefined,
    reservedTarget: undefined,
    reservedReasonId: undefined,
    campaignId: undefined,
  };

  /**
   * - Purpose: decide advance for operator drafts; return peek revision after gate.
   * - Inputs: operator:* draft + shared session clock.
   */
  preparePublish(
    draft: SdkPublicEventDraft,
    coordinator: SdkSessionRevisionCoordinator,
  ): Promise<SdkOperatorEventPublishResult> {
    return coordinator.runEventPublication((currentRevision, advance) =>
      this.prepareUnderCoordinatorLock(draft, currentRevision, advance),
    );
  }

  private prepareUnderCoordinatorLock(
    draft: SdkPublicEventDraft,
    currentRevision: number,
    advance: () => number,
  ): SdkOperatorEventPublishResult {
    if (
      draft.type !== "operator:status-changed" &&
      draft.type !== "operator:session-changed" &&
      draft.type !== "operator:campaign-offered" &&
      draft.type !== "operator:campaign-cleared"
    ) {
      return {
        draft,
        revision: currentRevision,
        advanced: false,
      };
    }

    let advanced = false;
    if (draft.type === "operator:status-changed") {
      const nextStatus = readPublicStatus(draft.payload);
      const nextReasonId = readReasonId(draft.payload);
      const nextReservedTarget = readReservedTarget(draft.payload);
      const nextReservedReasonId = readReservedReasonId(draft.payload);
      if (
        shouldAdvanceStatus(
          this.last,
          nextStatus,
          nextReasonId,
          nextReservedTarget,
          nextReservedReasonId,
        )
      ) {
        advance();
        advanced = true;
      }
      this.last = {
        ...this.last,
        status: nextStatus,
        reasonId: nextReasonId,
        reservedTarget: nextReservedTarget,
        reservedReasonId: nextReservedReasonId,
      };
    } else if (draft.type === "operator:session-changed") {
      const nextConnected = readConnected(draft.payload);
      if (
        nextConnected !== undefined &&
        this.last.connected !== nextConnected
      ) {
        advance();
        advanced = true;
      }
      this.last = {
        ...this.last,
        connected: nextConnected,
      };
    } else if (draft.type === "operator:campaign-offered") {
      const nextCampaignId = readCampaignId(draft.payload);
      if (
        nextCampaignId !== undefined &&
        this.last.campaignId !== nextCampaignId
      ) {
        advance();
        advanced = true;
      }
      this.last = {
        ...this.last,
        campaignId: nextCampaignId,
      };
    } else {
      const clearedId = readCampaignId(draft.payload);
      if (this.last.campaignId !== undefined) {
        advance();
        advanced = true;
      } else if (clearedId !== undefined) {
        advance();
        advanced = true;
      }
      this.last = {
        ...this.last,
        campaignId: undefined,
      };
    }

    return {
      draft,
      revision: advanced ? currentRevision + 1 : currentRevision,
      advanced,
    };
  }
}

function readCampaignId(payload: WireJsonObject): string | undefined {
  const campaignId = payload["campaignId"];
  return typeof campaignId === "string" && campaignId.length > 0
    ? campaignId
    : undefined;
}

export function isSdkOperatorPublicEventType(
  type: SdkPublicEventDraft["type"],
): boolean {
  return (
    type === "operator:status-changed" ||
    type === "operator:session-changed" ||
    type === "operator:campaign-offered" ||
    type === "operator:campaign-cleared"
  );
}

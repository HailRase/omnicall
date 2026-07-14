// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OperatorStatus,
  initialCampaignEventProjection,
  initialOperatorStatusProjection,
  reduceCampaignEventFromPayload,
  reduceOperatorStatusFromUsers,
  type CampaignEventProjection,
} from "@application/index.js";
import { ok, err } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useOcpCampaignModal } from "./useOcpCampaignModal.js";

type ActiveCampaign = NonNullable<CampaignEventProjection["activeCampaign"]>;

const campaign: ActiveCampaign = {
  id: "c1",
  callId: "call-1",
  queueId: "q1",
  abonentId: "a1",
  companyId: "co1",
  queueTitle: "Queue",
  selectionId: "s1",
  isAnswered: false,
  progressive: false,
  clientPhone: "+100",
  companyTitle: "Co",
  strategyTitle: "Strat",
  selectionTitle: "Sel",
  strategyCallId: "sc1",
};

afterEach(() => {
  cleanup();
  useAccountBootstrapStore.setState({
    ocpCampaignEventProjection: initialCampaignEventProjection(),
    ocpOperatorStatusProjection: initialOperatorStatusProjection(),
  });
});

function setOperatorAndCampaign(operatorId: number): void {
  useAccountBootstrapStore.setState({
    ocpCampaignEventProjection: reduceCampaignEventFromPayload(campaign),
    ocpOperatorStatusProjection: reduceOperatorStatusFromUsers(
      initialOperatorStatusProjection(),
      {
        operatorId,
        status: OperatorStatus.READY,
        reasonId: 1,
        statusSince: "2026-07-14T10:00:00.000Z",
      },
    ),
  });
}

function createFacade(overrides?: {
  acceptOcpCampaign?: ReturnType<typeof vi.fn>;
  rejectOcpCampaign?: ReturnType<typeof vi.fn>;
  clearOcpActiveCampaign?: ReturnType<typeof vi.fn>;
}): never {
  return {
    acceptOcpCampaign:
      overrides?.acceptOcpCampaign ?? vi.fn().mockResolvedValue(ok(undefined)),
    rejectOcpCampaign:
      overrides?.rejectOcpCampaign ?? vi.fn().mockResolvedValue(ok(undefined)),
    clearOcpActiveCampaign: overrides?.clearOcpActiveCampaign ?? vi.fn(),
  } as never;
}

describe("useOcpCampaignModal", () => {
  it("stays closed when no active campaign", () => {
    const { result } = renderHook(() =>
      useOcpCampaignModal({ facade: createFacade() }),
    );
    expect(result.current.open).toBe(false);
    expect(result.current.campaign).toBeNull();
  });

  it("opens for active campaign and accepts via use case", async () => {
    setOperatorAndCampaign(42);

    const acceptOcpCampaign = vi.fn().mockResolvedValue(ok(undefined));
    const clearOcpActiveCampaign = vi.fn().mockImplementation(() => {
      useAccountBootstrapStore.setState({
        ocpCampaignEventProjection: initialCampaignEventProjection(),
      });
    });

    const { result } = renderHook(() =>
      useOcpCampaignModal({
        facade: createFacade({ acceptOcpCampaign, clearOcpActiveCampaign }),
      }),
    );

    expect(result.current.open).toBe(true);
    expect(result.current.campaign?.campaignEventId).toBe("c1");

    await act(async () => {
      await result.current.handleAccept();
    });

    expect(acceptOcpCampaign).toHaveBeenCalledWith({
      operatorId: 42,
      campaignEventId: "c1",
    });
    expect(clearOcpActiveCampaign).toHaveBeenCalledTimes(1);
    expect(result.current.open).toBe(false);
  });

  it("rejects via use case", async () => {
    setOperatorAndCampaign(7);

    const rejectOcpCampaign = vi.fn().mockResolvedValue(ok(undefined));
    const clearOcpActiveCampaign = vi.fn();

    const { result } = renderHook(() =>
      useOcpCampaignModal({
        facade: createFacade({ rejectOcpCampaign, clearOcpActiveCampaign }),
      }),
    );

    await act(async () => {
      await result.current.handleReject();
    });

    expect(rejectOcpCampaign).toHaveBeenCalledWith({
      operatorId: 7,
      campaignEventId: "c1",
    });
    expect(clearOcpActiveCampaign).toHaveBeenCalledTimes(1);
  });

  it("notifies on accept failure and keeps campaign open", async () => {
    setOperatorAndCampaign(42);

    const notify = vi.fn();
    const acceptOcpCampaign = vi
      .fn()
      .mockResolvedValue(err(createPlatformError("operation_failed", "fail")));
    const clearOcpActiveCampaign = vi.fn();

    const { result } = renderHook(() =>
      useOcpCampaignModal({
        facade: createFacade({ acceptOcpCampaign, clearOcpActiveCampaign }),
        notify,
      }),
    );

    await act(async () => {
      await result.current.handleAccept();
    });

    expect(notify).toHaveBeenCalledWith({
      level: "error",
      messageKey: "ocp.campaign.modal.error",
    });
    expect(clearOcpActiveCampaign).not.toHaveBeenCalled();
    expect(result.current.open).toBe(true);
  });
});

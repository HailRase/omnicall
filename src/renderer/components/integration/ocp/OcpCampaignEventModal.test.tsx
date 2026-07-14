// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OcpCampaignEventModal } from "./OcpCampaignEventModal.js";

const campaign = {
  campaignEventId: "evt-1",
  companyTitle: "Acme",
  queueTitle: "Sales",
  selectionTitle: "VIP",
  strategyTitle: "Progressive",
  clientPhone: "+100200",
};

describe("OcpCampaignEventModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("hides when closed", () => {
    render(
      <OcpCampaignEventModal
        open={false}
        campaign={campaign}
        submitting={false}
        pendingAction={null}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("ocp-campaign-modal")).not.toBeInTheDocument();
  });

  it("shows campaign details and fires accept/reject", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(
      <OcpCampaignEventModal
        open
        campaign={campaign}
        submitting={false}
        pendingAction={null}
        onAccept={onAccept}
        onReject={onReject}
      />,
    );

    expect(screen.getByTestId("ocp-campaign-modal")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-campaign-details")).toHaveTextContent("Acme");
    expect(screen.getByTestId("ocp-campaign-details")).toHaveTextContent("+100200");

    await user.click(screen.getByTestId("ocp-campaign-accept"));
    expect(onAccept).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("ocp-campaign-reject"));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("disables actions while submitting", () => {
    render(
      <OcpCampaignEventModal
        open
        campaign={campaign}
        submitting
        pendingAction="accept"
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-campaign-accept")).toBeDisabled();
    expect(screen.getByTestId("ocp-campaign-reject")).toBeDisabled();
  });
});

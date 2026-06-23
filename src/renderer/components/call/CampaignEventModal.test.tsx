// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignEventModal } from "./CampaignEventModal.js";

afterEach(() => {
  cleanup();
});

describe("CampaignEventModal", () => {
  it("renders accept and reject controls with test IDs", () => {
    render(
      <CampaignEventModal
        open
        title="Outbound Campaign"
        progressive={false}
        acceptDisabledReason={null}
        rejectDisabledReason={null}
        responseError={null}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId("campaign-event-modal")).toBeInTheDocument();
    expect(screen.getByTestId("campaign-accept")).toBeEnabled();
    expect(screen.getByTestId("campaign-reject")).toBeEnabled();
  });

  it("disables accept and reject while response in progress", () => {
    render(
      <CampaignEventModal
        open
        title="Outbound Campaign"
        progressive={false}
        acceptDisabledReason="campaign_response_in_progress"
        rejectDisabledReason="campaign_response_in_progress"
        responseError={null}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId("campaign-accept")).toBeDisabled();
    expect(screen.getByTestId("campaign-reject")).toBeDisabled();
    expect(screen.getByTestId("campaign-disabled-reason")).toHaveTextContent(
      "Campaign response in progress",
    );
  });

  it("does not render for progressive campaigns", () => {
    const { container } = render(
      <CampaignEventModal
        open
        title="Auto Campaign"
        progressive
        acceptDisabledReason={null}
        rejectDisabledReason={null}
        responseError={null}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("emits accept and reject callbacks", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(
      <CampaignEventModal
        open
        title="Outbound Campaign"
        progressive={false}
        acceptDisabledReason={null}
        rejectDisabledReason={null}
        responseError={null}
        onAccept={onAccept}
        onReject={onReject}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("campaign-accept"));
    fireEvent.click(screen.getByTestId("campaign-reject"));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });
});

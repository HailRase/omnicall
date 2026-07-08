// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IncomingCallSessionCard } from "../components/call/IncomingCallSessionCard.js";
import { ContactsPanelShell } from "../components/contacts/ContactsPanelShell.js";
import { HistoryPanelShell } from "../components/history/HistoryPanelShell.js";
import { SoftphoneLayout } from "../widgets/SoftphoneLayout/SoftphoneLayout.js";

function createIncomingCallLayoutHarness({
  overlays,
  onAnswer,
  onReject,
}: Readonly<{
  overlays: JSX.Element;
  onAnswer: () => void;
  onReject: () => void;
}>): JSX.Element {
  return (
    <SoftphoneLayout
      header={<span>Header</span>}
      context={
        <div data-testid="call-context-zone">
          <IncomingCallSessionCard
            callId="incoming-1"
            callerNumber="+12025550100"
            displayName="John Doe"
            autoAnswerSecondsRemaining={null}
            autoAnswerTimeoutSec={null}
            uiState="incomingRinging"
            isSelected
            answerDisabledReason={null}
            rejectDisabledReason={null}
            onSelect={vi.fn()}
            onAnswer={onAnswer}
            onReject={onReject}
          />
        </div>
      }
      controls={<div data-testid="call-controls-zone">Controls</div>}
      overlays={overlays}
    />
  );
}

describe("shell overlay incoming call layering", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps incoming answer/reject actionable while history sidebar is open", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onReject = vi.fn();

    render(
      createIncomingCallLayoutHarness({
        onAnswer,
        onReject,
        overlays: (
          <HistoryPanelShell
            open
            presentation="sidebar"
            title="История звонков"
            isLoading={false}
            isEmpty
            errorMessage={null}
            rows={[]}
            onClose={() => undefined}
            onRedial={() => undefined}
          />
        ),
      }),
    );

    expect(screen.getByTestId("history-panel-shell")).toHaveAttribute(
      "data-shell-overlay-presentation",
      "sidebar",
    );

    await user.click(screen.getByTestId("answer-call"));
    await user.click(screen.getByTestId("reject-call"));

    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("keeps incoming answer/reject actionable while contacts sidebar is open", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onReject = vi.fn();

    render(
      createIncomingCallLayoutHarness({
        onAnswer,
        onReject,
        overlays: (
          <ContactsPanelShell open title="Контакты" onClose={() => undefined}>
            <p data-testid="contacts-body">Contacts body</p>
          </ContactsPanelShell>
        ),
      }),
    );

    expect(screen.getByTestId("contacts-panel-shell")).toHaveAttribute(
      "data-shell-overlay-presentation",
      "sidebar",
    );
    expect(screen.getByTestId("contacts-body")).toBeInTheDocument();

    await user.click(screen.getByTestId("answer-call"));
    await user.click(screen.getByTestId("reject-call"));

    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledOnce();
  });
});

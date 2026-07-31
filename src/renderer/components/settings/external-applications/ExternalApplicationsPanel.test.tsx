// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import {
  ExternalApplicationsPanel,
  type ExternalApplicationsPanelApplication,
  type ExternalApplicationsPanelProps,
} from "./ExternalApplicationsPanel.js";

afterEach(() => {
  cleanup();
});

const application = {
  id: "9f28d923-23c3-4b9e-9c4a-cc83719dd12e" as ExternalApplicationsPanelApplication["id"],
  name: "App",
  enabled: true,
  urlTemplate: "https://example.com/{{call_id}}",
  openMode: "electron_window",
  window: { width: 1100, height: 800 },
  variables: [],
  triggers: [],
  conditions: {
    callDirection: "any",
    queueNames: [],
  },
  windowBehavior: {
    raiseOnOpen: true,
    alwaysOnTopDuringCall: false,
    onCallEnded: "leave",
  },
} satisfies ExternalApplicationsPanelApplication;

function renderPanel(
  overrides: Partial<ExternalApplicationsPanelProps> = {},
): ReturnType<typeof render> {
  return render(
    <ExternalApplicationsPanel
      applications={[application]}
      selectedApplication={application}
      selection={{ kind: "application", id: application.id }}
      historyEntries={[]}
      historyLoading={false}
      historyError={false}
      busy={false}
      loadError={false}
      saveError={false}
      forceNameEditKey={0}
      onSelectApplication={vi.fn()}
      onSelectHistory={vi.fn()}
      onRetryHistory={vi.fn()}
      onCreate={vi.fn()}
      onToggle={vi.fn()}
      onRename={vi.fn()}
      onDuplicate={vi.fn()}
      onDelete={vi.fn()}
      onChange={vi.fn()}
      onSave={vi.fn()}
      onOpenNow={vi.fn()}
      {...overrides}
    />,
  );
}

describe("ExternalApplicationsPanel", () => {
  it("emits create and save intents for an application draft", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onSave = vi.fn();

    renderPanel({ onCreate, onSave });

    await user.click(screen.getByTestId("external-applications-add"));
    await user.click(screen.getByTestId("external-applications-save"));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("shows status indicator, history nav, and item actions menu", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();
    const onSelectHistory = vi.fn();

    renderPanel({ onToggle, onDuplicate, onDelete, onSelectHistory });

    expect(screen.getByTestId(`external-applications-status-${application.id}`)).toBeInTheDocument();
    expect(screen.getByTestId("external-applications-name")).toHaveTextContent("App");
    expect(screen.getByTestId("external-applications-tab-general")).toBeInTheDocument();
    expect(screen.getByTestId("external-applications-open-now")).toBeInTheDocument();
    expect(screen.getByTestId("external-applications-history-nav")).toBeInTheDocument();

    await user.click(screen.getByTestId("external-applications-history-nav"));
    expect(onSelectHistory).toHaveBeenCalledOnce();

    await user.click(screen.getByTestId(`external-applications-menu-${application.id}`));
    await user.click(screen.getByRole("menuitem", { name: /выключить|disable/i }));
    expect(onToggle).toHaveBeenCalledWith(application.id, false);

    await user.click(screen.getByTestId(`external-applications-menu-${application.id}`));
    await user.click(screen.getByRole("menuitem", { name: /дублировать|duplicate/i }));
    expect(onDuplicate).toHaveBeenCalledWith(application.id);

    await user.click(screen.getByTestId(`external-applications-menu-${application.id}`));
    await user.click(screen.getByRole("menuitem", { name: /удалить|delete/i }));
    expect(onDelete).toHaveBeenCalledWith(application.id);
  });

  it("renders history empty state when history is selected", () => {
    setupJsdomRadix();
    renderPanel({
      selectedApplication: null,
      selection: { kind: "history" },
    });
    expect(screen.getByTestId("external-applications-history-empty")).toBeInTheDocument();
  });
});

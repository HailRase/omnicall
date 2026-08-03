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

  it("selects open mode via illustrated radio cards", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPanel({ onChange });

    const group = screen.getByTestId("external-applications-open-mode");
    expect(group).toHaveAttribute("role", "radiogroup");

    const electronWindow = screen.getByRole("radio", {
      name: /окно приложения|application window/i,
    });
    const externalBrowser = screen.getByRole("radio", {
      name: /внешний браузер|external browser/i,
    });

    expect(electronWindow).toBeChecked();
    expect(externalBrowser).not.toBeChecked();

    await user.click(externalBrowser);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ openMode: "external_browser" }),
    );
  });

  it("keeps open-mode radios keyboard accessible", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPanel({ onChange });

    const electronWindow = screen.getByRole("radio", {
      name: /окно приложения|application window/i,
    });
    electronWindow.focus();
    expect(electronWindow).toHaveFocus();

    // Horizontal roving focus + Space select (jsdom may skip Radix arrow-click sync).
    await user.keyboard("{ArrowRight}");
    const externalBrowser = screen.getByRole("radio", {
      name: /внешний браузер|external browser/i,
    });
    expect(externalBrowser).toHaveFocus();

    await user.keyboard(" ");
    // Controlled panel does not re-render selection; assert draft intent only.
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ openMode: "external_browser" }),
    );
  });

  it("selects onCallEnded via illustrated radio cards", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPanel({ onChange });

    const group = screen.getByTestId("external-applications-on-call-ended");
    expect(group).toHaveAttribute("role", "radiogroup");
    expect(screen.getByTestId("external-applications-window-behavior")).toBeInTheDocument();

    const leave = screen.getByRole("radio", { name: /оставить|leave open/i });
    const minimize = screen.getByRole("radio", { name: /свернуть|minimize/i });
    const close = screen.getByRole("radio", { name: /закрыть|close/i });

    expect(leave).toBeChecked();
    expect(minimize).not.toBeChecked();
    expect(close).not.toBeChecked();

    await user.click(minimize);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        windowBehavior: expect.objectContaining({ onCallEnded: "minimize" }),
      }),
    );
  });

  it("keeps onCallEnded radios keyboard accessible", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPanel({ onChange });

    const leave = screen.getByRole("radio", { name: /оставить|leave open/i });
    leave.focus();
    expect(leave).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    const minimize = screen.getByRole("radio", { name: /свернуть|minimize/i });
    expect(minimize).toHaveFocus();

    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        windowBehavior: expect.objectContaining({ onCallEnded: "minimize" }),
      }),
    );
  });

  it("hides window behavior when open mode is external browser", () => {
    setupJsdomRadix();
    const browserApp = { ...application, openMode: "external_browser" as const };

    renderPanel({
      applications: [browserApp],
      selectedApplication: browserApp,
    });

    expect(screen.queryByTestId("external-applications-window-behavior")).not.toBeInTheDocument();
    expect(screen.queryByTestId("external-applications-on-call-ended")).not.toBeInTheDocument();
    expect(screen.queryByTestId("external-applications-raise-on-open")).not.toBeInTheDocument();
    expect(screen.queryByTestId("external-applications-always-on-top")).not.toBeInTheDocument();
  });

  it("toggles raiseOnOpen and alwaysOnTop with illustrated switch previews", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPanel({ onChange });

    const raiseRow = screen.getByTestId("external-applications-raise-on-open");
    const alwaysOnTopRow = screen.getByTestId("external-applications-always-on-top");

    expect(raiseRow).toHaveAttribute("data-active", "true");
    expect(alwaysOnTopRow).toHaveAttribute("data-active", "false");
    expect(raiseRow.querySelector("svg")).toBeTruthy();
    expect(alwaysOnTopRow.querySelector("svg")).toBeTruthy();

    await user.click(
      screen.getByRole("switch", { name: /поднять при открытии|raise on open/i }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        windowBehavior: expect.objectContaining({ raiseOnOpen: false }),
      }),
    );

    await user.click(
      screen.getByRole("switch", {
        name: /поверх окон во время звонка|always on top during call/i,
      }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        windowBehavior: expect.objectContaining({ alwaysOnTopDuringCall: true }),
      }),
    );
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  window: { width: 1100, height: 800, x: 100, y: 100 },
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
      isDirty={false}
      discardDialogOpen={false}
      onDiscardDialogOpenChange={vi.fn()}
      onDiscardConfirm={vi.fn()}
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

    renderPanel({ onCreate, onSave, isDirty: true });

    await user.click(screen.getByTestId("external-applications-add"));
    await user.click(screen.getByTestId("external-applications-save"));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("highlights unsaved state and shows discard dialog", () => {
    setupJsdomRadix();
    renderPanel({
      isDirty: true,
      discardDialogOpen: true,
    });

    expect(screen.getByTestId(`external-applications-item-${application.id}`)).toHaveAttribute(
      "data-dirty",
      "true",
    );
    expect(screen.getByTestId("external-applications-unsaved-hint")).toBeInTheDocument();
    expect(screen.getByTestId("external-applications-save")).toBeEnabled();
    expect(screen.getByTestId("external-applications-discard-changes")).toBeInTheDocument();
  });

  it("keeps save disabled when draft is clean", () => {
    setupJsdomRadix();
    renderPanel({ isDirty: false });

    expect(screen.getByTestId("external-applications-save")).toBeDisabled();
    expect(screen.queryByTestId("external-applications-unsaved-hint")).not.toBeInTheDocument();
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

    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      windowBehavior: { onCallEnded: "minimize" },
    });
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
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      windowBehavior: { onCallEnded: "minimize" },
    });
  });

  it("hides window behavior and geometry when open mode is external browser", () => {
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
    expect(screen.queryByTestId("external-applications-window-geometry")).not.toBeInTheDocument();
  });

  it("shows window geometry editor for electron_window and applies a size preset", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPanel({ onChange });

    expect(screen.getByTestId("external-applications-window-geometry")).toBeInTheDocument();
    expect(screen.getByTestId("external-applications-geometry-preview")).toBeInTheDocument();

    await user.click(
      screen.getByTestId("external-applications-geometry-preset-vga"),
    );
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      window: { width: 640, height: 480 },
    });
  });

  it("updates geometry X/Y from numeric inputs on blur", () => {
    setupJsdomRadix();
    const onChange = vi.fn();

    renderPanel({ onChange });

    const xInput = screen.getByTestId("external-applications-geometry-x");
    fireEvent.change(xInput, {
      target: { value: "220" },
    });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(xInput);

    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      window: { x: 220 },
    });
  });

  it("toggles geometry overlay peers from Layers menu and preview", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const peerWindow = {
      ...application,
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" as ExternalApplicationsPanelApplication["id"],
      name: "CRM Overlay",
      window: { width: 800, height: 600, x: 40, y: 60 },
    };
    const browserPeer = {
      ...application,
      id: "b2c3d4e5-f6a7-8901-bcde-f12345678901" as ExternalApplicationsPanelApplication["id"],
      name: "Browser Only",
      openMode: "external_browser" as const,
    };

    renderPanel({
      applications: [application, peerWindow, browserPeer],
      selectedApplication: application,
    });

    const trigger = screen.getByTestId("external-applications-geometry-overlays-trigger");
    expect(trigger).toBeEnabled();
    expect(trigger).toHaveAttribute("data-active", "false");

    await user.click(trigger);
    expect(
      screen.queryByTestId(
        `external-applications-geometry-overlay-option-${application.id}`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `external-applications-geometry-overlay-option-${browserPeer.id}`,
      ),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByTestId(
        `external-applications-geometry-overlay-option-${peerWindow.id}`,
      ),
    );

    expect(
      screen.getByTestId(
        `external-applications-geometry-overlay-card-${peerWindow.id}`,
      ),
    ).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-active", "true");

    await user.click(
      screen.getByTestId(
        `external-applications-geometry-overlay-option-${peerWindow.id}`,
      ),
    );
    expect(
      screen.queryByTestId(
        `external-applications-geometry-overlay-card-${peerWindow.id}`,
      ),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-active", "false");

    await user.click(
      screen.getByTestId(
        `external-applications-geometry-overlay-option-${peerWindow.id}`,
      ),
    );
    expect(
      screen.getByTestId(
        `external-applications-geometry-overlay-card-${peerWindow.id}`,
      ),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.click(
      screen.getByTestId(
        `external-applications-geometry-overlay-remove-preview-${peerWindow.id}`,
      ),
    );
    expect(
      screen.queryByTestId(
        `external-applications-geometry-overlay-card-${peerWindow.id}`,
      ),
    ).not.toBeInTheDocument();
  });

  it("disables overlays trigger when no other electron_window apps exist", () => {
    setupJsdomRadix();
    renderPanel();

    expect(
      screen.getByTestId("external-applications-geometry-overlays-trigger"),
    ).toBeDisabled();
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
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      windowBehavior: { raiseOnOpen: false },
    });

    await user.click(
      screen.getByRole("switch", {
        name: /поверх окон во время звонка|always on top during call/i,
      }),
    );
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      windowBehavior: { alwaysOnTopDuringCall: true },
    });
  });
});

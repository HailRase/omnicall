// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultUserNotificationPreferences } from "@application/index.js";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsNotificationCenterPanel } from "./SettingsNotificationCenterPanel.js";

beforeEach(setupJsdomRadix);
afterEach(cleanup);

function createAppearanceProps() {
  return {
    notificationPlacement: "bottom-right" as const,
    onNotificationPlacementChange: vi.fn(),
    notificationStacking: "stacked" as const,
    onNotificationStackingChange: vi.fn(),
    notificationDurationMs: 4200,
    onNotificationDurationMsChange: vi.fn(),
    notificationMaxVisible: 3,
    onNotificationMaxVisibleChange: vi.fn(),
    notificationClosable: true,
    onNotificationClosableChange: vi.fn(),
  };
}

function createPreferenceCallbacks() {
  return {
    onMasterInAppPopupEnabledChange: vi.fn(),
    onModuleEnabledChange: vi.fn(),
    onModuleMinLevelChange: vi.fn(),
    onModuleRaiseWindowChange: vi.fn(),
    onApplyPreset: vi.fn(),
  };
}

describe("SettingsNotificationCenterPanel", () => {
  it("renders Preferences tab with master toggle, modules, and raise controls", () => {
    render(
      <SettingsNotificationCenterPanel
        preferences={createDefaultUserNotificationPreferences()}
        {...createPreferenceCallbacks()}
        {...createAppearanceProps()}
      />,
    );

    expect(screen.getByTestId("settings-notification-center")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-notification-center-tab-preferences"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings-notification-master-popup")).toBeChecked();
    expect(screen.getByTestId("settings-notification-module-telephony")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-notification-module-telephony-raise"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-notification-module-telephony-min-level"),
    ).toHaveTextContent("Все");
    expect(screen.getAllByText("Показывать всплывающие").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Выбранная важность и всё, что серьёзнее.").length,
    ).toBeGreaterThan(0);
  });

  it("persists master toggle and quiet-successes preset through callbacks", async () => {
    const user = userEvent.setup();
    const callbacks = createPreferenceCallbacks();

    render(
      <SettingsNotificationCenterPanel
        preferences={createDefaultUserNotificationPreferences()}
        {...callbacks}
        {...createAppearanceProps()}
      />,
    );

    await user.click(screen.getByTestId("settings-notification-master-popup"));
    expect(callbacks.onMasterInAppPopupEnabledChange).toHaveBeenCalledWith(false);

    await user.click(screen.getByTestId("settings-notification-preset-quiet-successes"));
    expect(callbacks.onApplyPreset).toHaveBeenCalledWith("quietSuccesses");

    await user.click(screen.getByTestId("settings-notification-module-contacts-enabled"));
    expect(callbacks.onModuleEnabledChange).toHaveBeenCalledWith("contacts", false);
  });

  it("shows master-off hint and wires Appearance editors", async () => {
    const user = userEvent.setup();
    const appearanceProps = createAppearanceProps();
    const prefs = {
      ...createDefaultUserNotificationPreferences(),
      masterInAppPopupEnabled: false,
    };

    render(
      <SettingsNotificationCenterPanel
        preferences={prefs}
        {...createPreferenceCallbacks()}
        {...appearanceProps}
      />,
    );

    expect(screen.getByTestId("settings-notification-master-off-hint")).toHaveTextContent(
      "Всплывающие уведомления отключены",
    );

    await user.click(screen.getByTestId("settings-notification-center-tab-appearance"));
    expect(screen.getByTestId("settings-notification-appearance")).toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-notification-appearance-placeholder"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("settings-notification-placement-top-left"));
    expect(appearanceProps.onNotificationPlacementChange).toHaveBeenCalledWith("top-left");

    fireEvent.change(screen.getByTestId("settings-notification-duration"), {
      target: { value: "5000" },
    });
    expect(appearanceProps.onNotificationDurationMsChange).toHaveBeenCalledWith(5000);
  });

  it("honors controlled Appearance tab selection", () => {
    render(
      <SettingsNotificationCenterPanel
        preferences={createDefaultUserNotificationPreferences()}
        {...createPreferenceCallbacks()}
        {...createAppearanceProps()}
        activeTab="appearance"
        onActiveTabChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("settings-notification-appearance")).toBeInTheDocument();
  });

  it("hosts history panel on History tab when query is provided", async () => {
    const user = userEvent.setup();
    const query = vi.fn().mockResolvedValue({
      entries: [],
      total: 0,
      page: 1,
      pageSize: 20,
      pageCount: 1,
      identities: [],
    });

    render(
      <SettingsNotificationCenterPanel
        preferences={createDefaultUserNotificationPreferences()}
        {...createPreferenceCallbacks()}
        {...createAppearanceProps()}
        notificationHistoryQuery={query}
      />,
    );

    await user.click(screen.getByTestId("settings-notification-center-tab-history"));
    expect(await screen.findByTestId("settings-notification-history")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("settings-notification-history-empty")).toBeInTheDocument();
    });
    expect(query).toHaveBeenCalled();
  });
});

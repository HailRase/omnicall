// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsSidebar } from "./SettingsSidebar.js";

afterEach(() => {
  cleanup();
});

describe("SettingsSidebar", () => {
  it("expands flyout without changing rail width marker", async () => {
    const user = userEvent.setup();
    const onToggleExpanded = vi.fn();

    render(
      <SettingsSidebar
        activeSection="general"
        expanded={false}
        onSectionChange={vi.fn()}
        onToggleExpanded={onToggleExpanded}
      />,
    );

    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute("data-expanded", "false");

    await user.click(screen.getByTestId("settings-sidebar-expand"));
    expect(onToggleExpanded).toHaveBeenCalledOnce();
  });

  it("shows labels when expanded", () => {
    render(
      <SettingsSidebar
        activeSection="account"
        expanded
        onSectionChange={vi.fn()}
        onToggleExpanded={vi.fn()}
      />,
    );

    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute("data-expanded", "true");
    expect(screen.getByText("Аккаунт")).toBeVisible();
    expect(screen.getByText("Диагностика")).toBeVisible();
  });
});

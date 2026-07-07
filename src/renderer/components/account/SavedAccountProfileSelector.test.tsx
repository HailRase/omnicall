// @vitest-environment jsdom
import type { ComponentProps } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsAccountKey } from "@application/index.js";
import { setRendererLanguage } from "../../i18n/index.js";
import { SavedAccountProfileSelector } from "./SavedAccountProfileSelector.js";

const profileOneId = createSettingsAccountKey("agent@pbx.one");
const profileTwoId = createSettingsAccountKey("agent@pbx.two");

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

function renderSelector(
  props: Partial<ComponentProps<typeof SavedAccountProfileSelector>> = {},
): void {
  render(
    <SavedAccountProfileSelector
      options={[
        { id: profileOneId, label: "agent" },
        { id: profileTwoId, label: "agent @ pbx.two" },
      ]}
      selectedProfileId={null}
      onSelect={vi.fn()}
      onDeleteRequest={vi.fn()}
      {...props}
    />,
  );
}

describe("SavedAccountProfileSelector", () => {
  beforeEach(() => {
    setRendererLanguage("ru");
  });

  it("renders New as the first tab with localized label", () => {
    renderSelector();

    expect(screen.getByTestId("saved-account-profile-tab-new")).toHaveTextContent("Новый");
    expect(screen.getByRole("tab", { name: "Новый" })).toHaveAttribute("aria-selected", "true");
  });

  it("lists saved profiles with disambiguated labels", () => {
    renderSelector();

    expect(screen.getByRole("tab", { name: "agent" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "agent @ pbx.two" })).toBeInTheDocument();
  });

  it("renders a red trash icon on each saved profile tab", () => {
    renderSelector();

    const deleteButtons = screen.getAllByTestId("saved-account-profile-tab-delete");
    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0]).toHaveAccessibleName("Удалить");
  });

  it("invokes onSelect when a saved profile tab is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSelector({ onSelect });

    await user.click(screen.getByRole("tab", { name: "agent" }));

    expect(onSelect).toHaveBeenCalledWith(profileOneId);
  });

  it("invokes onSelect with null when New tab is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSelector({
      selectedProfileId: profileOneId,
      onSelect,
    });

    await user.click(screen.getByTestId("saved-account-profile-tab-new"));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("invokes onDeleteRequest with profile id when trash icon is clicked", async () => {
    const user = userEvent.setup();
    const onDeleteRequest = vi.fn();
    renderSelector({ onDeleteRequest });

    const tabGroups = screen.getAllByTestId("saved-account-profile-tab-group");
    const secondGroup = tabGroups.find((group) => group.getAttribute("data-profile-id") === profileTwoId);
    expect(secondGroup).toBeDefined();

    const deleteButton = secondGroup?.querySelector(
      '[data-testid="saved-account-profile-tab-delete"]',
    );
    expect(deleteButton).toBeTruthy();

    await user.click(deleteButton as HTMLElement);

    expect(onDeleteRequest).toHaveBeenCalledWith(profileTwoId);
    expect(onDeleteRequest).toHaveBeenCalledOnce();
  });

  it("disables per-tab delete icons when selector is disabled", () => {
    renderSelector({ disabled: true });

    for (const deleteButton of screen.getAllByTestId("saved-account-profile-tab-delete")) {
      expect(deleteButton).toBeDisabled();
    }
  });

  it("supports arrow-key navigation between tabs", async () => {
    const user = userEvent.setup();
    renderSelector();

    await user.tab();
    expect(screen.getByRole("tab", { name: "Новый" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "agent" })).toHaveFocus();
  });
});

// @vitest-environment jsdom
import type { ComponentProps } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsAccountKey } from "@application/index.js";
import { setRendererLanguage } from "../../i18n/index.js";
import { SavedAccountProfileSelector } from "./SavedAccountProfileSelector.js";

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
        { id: createSettingsAccountKey("agent@pbx.one"), label: "agent" },
        { id: createSettingsAccountKey("agent@pbx.two"), label: "agent @ pbx.two" },
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

  it("invokes onSelect when a saved profile tab is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSelector({ onSelect });

    await user.click(screen.getByRole("tab", { name: "agent" }));

    expect(onSelect).toHaveBeenCalledWith(createSettingsAccountKey("agent@pbx.one"));
  });

  it("invokes onSelect with null when New tab is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSelector({
      selectedProfileId: createSettingsAccountKey("agent@pbx.one"),
      onSelect,
    });

    await user.click(screen.getByTestId("saved-account-profile-tab-new"));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("supports arrow-key navigation between tabs", async () => {
    const user = userEvent.setup();
    renderSelector();

    await user.tab();
    expect(screen.getByRole("tab", { name: "Новый" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "agent" })).toHaveFocus();
  });

  it("disables delete until a saved profile is selected", () => {
    renderSelector();

    expect(screen.getByTestId("saved-account-profile-delete")).toBeDisabled();

    cleanup();
    renderSelector({ selectedProfileId: createSettingsAccountKey("agent@pbx.one") });
    expect(screen.getByTestId("saved-account-profile-delete")).toBeEnabled();
  });
});

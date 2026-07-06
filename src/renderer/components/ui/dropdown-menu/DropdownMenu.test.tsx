// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../button/Button.js";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu.js";

afterEach(() => {
  cleanup();
});

function BasicMenu({
  onProfileSelect,
  onSettingsSelect,
  onDisabledSelect,
}: Readonly<{
  onProfileSelect?: () => void;
  onSettingsSelect?: () => void;
  onDisabledSelect?: () => void;
}>): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {onProfileSelect ? (
          <DropdownMenuItem onSelect={onProfileSelect}>Profile</DropdownMenuItem>
        ) : (
          <DropdownMenuItem>Profile</DropdownMenuItem>
        )}
        {onSettingsSelect ? (
          <DropdownMenuItem onSelect={onSettingsSelect}>Settings</DropdownMenuItem>
        ) : (
          <DropdownMenuItem>Settings</DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={true} onSelect={onDisabledSelect ?? (() => undefined)}>
          Disabled action
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ControlledMenu(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="primary">Toggle menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setOpen(false)}>Close menu</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CheckboxMenu(): JSX.Element {
  const [checked, setChecked] = useState(false);

  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">View</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        >
          Status bar
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("opens from trigger", async () => {
    const user = userEvent.setup();

    render(<BasicMenu />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Profile" })).toBeInTheDocument();
  });

  it("selects item", async () => {
    const user = userEvent.setup();
    const onProfileSelect = vi.fn();

    render(<BasicMenu onProfileSelect={onProfileSelect} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "Profile" }));

    expect(onProfileSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("skips disabled item selection", async () => {
    const user = userEvent.setup();
    const onDisabledSelect = vi.fn();

    render(<BasicMenu onDisabledSelect={onDisabledSelect} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = await screen.findByRole("menu");
    const disabledItem = within(menu).getByRole("menuitem", { name: "Disabled action" });

    expect(disabledItem).toHaveAttribute("data-disabled");

    await user.click(disabledItem);

    expect(onDisabledSelect).not.toHaveBeenCalled();
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();
    const onSettingsSelect = vi.fn();

    render(<BasicMenu onSettingsSelect={onSettingsSelect} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();

    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    const profileItem = within(menu).getByRole("menuitem", { name: "Profile" });

    expect(profileItem).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    const settingsItem = within(menu).getByRole("menuitem", { name: "Settings" });
    expect(settingsItem).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(profileItem).toHaveFocus();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSettingsSelect).toHaveBeenCalledTimes(1);
  });

  it("closes on escape", async () => {
    const user = userEvent.setup();

    render(<BasicMenu />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });

  it("supports controlled open state", async () => {
    const user = userEvent.setup();

    render(<ControlledMenu />);

    await user.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Close menu" }));

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("toggles checkbox item", async () => {
    const user = userEvent.setup();

    render(<CheckboxMenu />);

    const checkboxItem = await screen.findByRole("menuitemcheckbox", { name: "Status bar" });
    expect(checkboxItem).toHaveAttribute("aria-checked", "false");

    await user.click(checkboxItem);

    expect(checkboxItem).toHaveAttribute("aria-checked", "true");
  });

  it("preserves caller className on content", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="custom-menu-panel">
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(await screen.findByRole("menu")).toHaveClass("custom-menu-panel");
  });
});

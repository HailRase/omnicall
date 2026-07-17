// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState, type JSX } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs.js";

beforeEach(setupJsdomRadix);
afterEach(() => {
  cleanup();
});

function BasicTabs({
  onValueChange,
  defaultValue = "account",
}: Readonly<{
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}>): JSX.Element {
  return (
    <Tabs
      defaultValue={defaultValue}
      {...(onValueChange !== undefined ? { onValueChange } : {})}
    >
      <TabsList aria-label="Settings sections">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="audio">Audio</TabsTrigger>
        <TabsTrigger value="network">Network</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="audio">Audio panel</TabsContent>
      <TabsContent value="network">Network panel</TabsContent>
    </Tabs>
  );
}

function ControlledTabs(): JSX.Element {
  const [value, setValue] = useState("account");

  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList aria-label="Controlled sections">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="audio">Audio</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="audio">Audio panel</TabsContent>
    </Tabs>
  );
}

function DisabledTabExample(): JSX.Element {
  return (
    <Tabs defaultValue="account">
      <TabsList aria-label="Sections with disabled tab">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="audio" disabled>
          Audio
        </TabsTrigger>
        <TabsTrigger value="network">Network</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="audio">Audio panel</TabsContent>
      <TabsContent value="network">Network panel</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("switches tab on click", async () => {
    const user = userEvent.setup();

    render(<BasicTabs />);

    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("tabpanel", { name: "Account" })).toBeVisible();
    expect(screen.queryByRole("tabpanel", { name: "Audio" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Audio" }));

    expect(screen.getByRole("tab", { name: "Audio" })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("tabpanel", { name: "Audio" })).toBeVisible();
    expect(screen.queryByRole("tabpanel", { name: "Account" })).not.toBeInTheDocument();
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();

    render(<BasicTabs defaultValue="account" />);

    await user.tab();
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Audio" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Audio" })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("tabpanel", { name: "Audio" })).toBeVisible();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Network" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Network" })).toBeVisible();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Audio" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Audio" })).toBeVisible();
  });

  it("emits selected value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<BasicTabs onValueChange={onValueChange} />);

    await user.click(screen.getByRole("tab", { name: "Network" }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("network");
  });

  it("supports controlled value", async () => {
    const user = userEvent.setup();

    render(<ControlledTabs />);

    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("data-state", "active");

    await user.click(screen.getByRole("tab", { name: "Audio" }));

    expect(screen.getByRole("tab", { name: "Audio" })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("tabpanel", { name: "Audio" })).toBeVisible();
  });

  it("skips disabled tab selection", async () => {
    const user = userEvent.setup();

    render(<DisabledTabExample />);

    const disabledTab = screen.getByRole("tab", { name: "Audio" });
    expect(disabledTab).toBeDisabled();
    expect(disabledTab).toHaveAttribute("data-disabled", "true");

    await user.click(disabledTab);

    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("data-state", "active");
    expect(screen.queryByRole("tabpanel", { name: "Audio" })).not.toBeInTheDocument();
  });

  it("supports vertical keyboard navigation", async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="account" orientation="vertical">
        <TabsList aria-label="Vertical sections">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account panel</TabsContent>
        <TabsContent value="audio">Audio panel</TabsContent>
      </Tabs>,
    );

    await user.tab();
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Audio" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Audio" })).toBeVisible();
  });

  it("forwards ref to the tab trigger", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger ref={ref} value="account">
            Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account panel</TabsContent>
      </Tabs>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute("data-state", "active");
  });

  it("preserves caller className on trigger", () => {
    render(
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account" className="custom-tab-trigger">
            Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account panel</TabsContent>
      </Tabs>,
    );

    expect(screen.getByRole("tab", { name: "Account" })).toHaveClass("custom-tab-trigger");
  });

  it("renders sliding indicator and moves it when the active tab changes", async () => {
    const user = userEvent.setup();
    // Prototype method extract for restore after mock; not an unbound call site.
    // eslint-disable-next-line @typescript-eslint/unbound-method -- intentional prototype patch
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function getBoundingClientRectMock(): DOMRect {
      const element = this as HTMLElement;
      if (element.getAttribute("role") === "tablist") {
        return new DOMRect(0, 0, 300, 40);
      }
      if (element.getAttribute("data-state") === "active") {
        const isAudio = element.textContent === "Audio";
        return new DOMRect(isAudio ? 120 : 8, 4, 100, 32);
      }
      if (element.getAttribute("role") === "tab") {
        return new DOMRect(8, 4, 100, 32);
      }
      return new DOMRect(0, 0, 0, 0);
    };

    try {
      render(
        <Tabs defaultValue="account">
          <TabsList aria-label="Sliding sections" indicator="slide">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account panel</TabsContent>
          <TabsContent value="audio">Audio panel</TabsContent>
        </Tabs>,
      );

      const indicator = screen.getByTestId("ui-tabs-indicator");
      await waitFor(() => {
        expect(indicator).toHaveAttribute("data-ready", "true");
      });
      expect(indicator).toHaveStyle({
        transform: "translate(8px, 4px)",
        width: "100px",
        height: "32px",
      });

      await user.click(screen.getByRole("tab", { name: "Audio" }));

      await waitFor(() => {
        expect(indicator).toHaveStyle({
          transform: "translate(120px, 4px)",
        });
      });
    } finally {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  it("protects controlled disabled attribute from native prop override", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Tabs defaultValue="account" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="audio" disabled data-disabled={undefined}>
            Audio
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account panel</TabsContent>
        <TabsContent value="audio">Audio panel</TabsContent>
      </Tabs>,
    );

    const disabledTab = screen.getByRole("tab", { name: "Audio" });
    expect(disabledTab).toBeDisabled();
    expect(disabledTab).toHaveAttribute("data-disabled", "true");

    await user.click(disabledTab);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("data-state", "active");
  });
});

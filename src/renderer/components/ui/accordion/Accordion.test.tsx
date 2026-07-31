// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState, type JSX } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./Accordion.js";

beforeEach(setupJsdomRadix);
afterEach(() => {
  cleanup();
});

function BasicAccordion({
  onValueChange,
  defaultValue,
}: Readonly<{
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}>): JSX.Element {
  return (
    <Accordion
      type="single"
      collapsible
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onValueChange !== undefined ? { onValueChange } : {})}
    >
      <AccordionItem value="account">
        <AccordionTrigger>Account</AccordionTrigger>
        <AccordionContent>Account panel</AccordionContent>
      </AccordionItem>
      <AccordionItem value="audio">
        <AccordionTrigger>Audio</AccordionTrigger>
        <AccordionContent>Audio panel</AccordionContent>
      </AccordionItem>
      <AccordionItem value="network">
        <AccordionTrigger>Network</AccordionTrigger>
        <AccordionContent>Network panel</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ControlledAccordion(): JSX.Element {
  const [value, setValue] = useState("account");

  return (
    <Accordion type="single" value={value} onValueChange={setValue} collapsible>
      <AccordionItem value="account">
        <AccordionTrigger>Account</AccordionTrigger>
        <AccordionContent>Account panel</AccordionContent>
      </AccordionItem>
      <AccordionItem value="audio">
        <AccordionTrigger>Audio</AccordionTrigger>
        <AccordionContent>Audio panel</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function DisabledItemExample(): JSX.Element {
  return (
    <Accordion type="single" defaultValue="account" collapsible>
      <AccordionItem value="account">
        <AccordionTrigger>Account</AccordionTrigger>
        <AccordionContent>Account panel</AccordionContent>
      </AccordionItem>
      <AccordionItem value="audio" disabled>
        <AccordionTrigger>Audio</AccordionTrigger>
        <AccordionContent>Audio panel</AccordionContent>
      </AccordionItem>
      <AccordionItem value="network">
        <AccordionTrigger>Network</AccordionTrigger>
        <AccordionContent>Network panel</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("opens and closes items on click", async () => {
    const user = userEvent.setup();

    render(<BasicAccordion defaultValue="account" />);

    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "open");
    expect(screen.getByText("Account panel")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Audio" }));

    expect(screen.getByRole("button", { name: "Audio" })).toHaveAttribute("data-state", "open");
    expect(screen.getByText("Audio panel")).toBeVisible();
    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "closed");

    await user.click(screen.getByRole("button", { name: "Audio" }));

    expect(screen.getByRole("button", { name: "Audio" })).toHaveAttribute("data-state", "closed");
  });

  it("supports keyboard activation with Enter and Space", async () => {
    const user = userEvent.setup();

    render(<BasicAccordion />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Account" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "open");
    expect(screen.getByText("Account panel")).toBeVisible();

    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "closed");
  });

  it("emits selected value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<BasicAccordion defaultValue="account" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Network" }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("network");
  });

  it("supports controlled value", async () => {
    const user = userEvent.setup();

    render(<ControlledAccordion />);

    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "open");

    await user.click(screen.getByRole("button", { name: "Audio" }));

    expect(screen.getByRole("button", { name: "Audio" })).toHaveAttribute("data-state", "open");
    expect(screen.getByText("Audio panel")).toBeVisible();
  });

  it("skips disabled item selection", async () => {
    const user = userEvent.setup();

    render(<DisabledItemExample />);

    const disabledTrigger = screen.getByRole("button", { name: "Audio" });
    expect(disabledTrigger).toBeDisabled();
    expect(disabledTrigger).toHaveAttribute("data-disabled");
    expect(disabledTrigger.closest('[data-slot="accordion-item"]')).toHaveAttribute(
      "data-disabled",
      "true",
    );

    await user.click(disabledTrigger);

    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "open");
    expect(screen.queryByText("Audio panel")).not.toBeInTheDocument();
  });

  it("supports multiple open items", async () => {
    const user = userEvent.setup();

    render(
      <Accordion type="multiple" defaultValue={["account"]}>
        <AccordionItem value="account">
          <AccordionTrigger>Account</AccordionTrigger>
          <AccordionContent>Account panel</AccordionContent>
        </AccordionItem>
        <AccordionItem value="audio">
          <AccordionTrigger>Audio</AccordionTrigger>
          <AccordionContent>Audio panel</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "open");

    await user.click(screen.getByRole("button", { name: "Audio" }));

    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "open");
    expect(screen.getByRole("button", { name: "Audio" })).toHaveAttribute("data-state", "open");
    expect(screen.getByText("Account panel")).toBeVisible();
    expect(screen.getByText("Audio panel")).toBeVisible();
  });

  it("forwards ref to the accordion trigger", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <Accordion type="single" defaultValue="account" collapsible>
        <AccordionItem value="account">
          <AccordionTrigger ref={ref}>Account</AccordionTrigger>
          <AccordionContent>Account panel</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute("data-state", "open");
  });

  it("preserves caller className on item and trigger", () => {
    render(
      <Accordion type="single" defaultValue="account" collapsible className="custom-accordion">
        <AccordionItem value="account" className="custom-item">
          <AccordionTrigger className="custom-trigger">Account</AccordionTrigger>
          <AccordionContent className="custom-content">Account panel</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByRole("button", { name: "Account" }).closest('[data-slot="accordion"]')).toHaveClass(
      "custom-accordion",
    );
    expect(screen.getByRole("button", { name: "Account" }).closest('[data-slot="accordion-item"]')).toHaveClass(
      "custom-item",
    );
    expect(screen.getByRole("button", { name: "Account" })).toHaveClass("custom-trigger");
    expect(screen.getByText("Account panel").closest('[data-slot="accordion-content"]')).toHaveClass(
      "custom-content",
    );
  });

  it("protects controlled disabled attribute from native prop override", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Accordion type="single" defaultValue="account" collapsible onValueChange={onValueChange}>
        <AccordionItem value="account">
          <AccordionTrigger>Account</AccordionTrigger>
          <AccordionContent>Account panel</AccordionContent>
        </AccordionItem>
        <AccordionItem value="audio" disabled data-disabled={undefined}>
          <AccordionTrigger>Audio</AccordionTrigger>
          <AccordionContent>Audio panel</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const disabledTrigger = screen.getByRole("button", { name: "Audio" });
    expect(disabledTrigger).toBeDisabled();
    expect(disabledTrigger).toHaveAttribute("data-disabled");
    expect(disabledTrigger.closest('[data-slot="accordion-item"]')).toHaveAttribute(
      "data-disabled",
      "true",
    );

    await user.click(disabledTrigger);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("data-state", "open");
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState, type JSX } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Select, type SelectItemOption } from "./Select.js";

const LANGUAGE_ITEMS: readonly SelectItemOption[] = [
  { value: "ru", label: "Russian" },
  { value: "en", label: "English" },
  { value: "fr", label: "French", disabled: true },
];

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => undefined;
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => undefined;
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => undefined;
  }
});

function BasicSelect({
  onValueChange,
  defaultValue,
}: Readonly<{
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}>): JSX.Element {
  return (
    <Select
      aria-label="Language"
      items={LANGUAGE_ITEMS}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      placeholder="Choose language"
      {...(onValueChange !== undefined ? { onValueChange } : {})}
    />
  );
}

function ControlledSelect(): JSX.Element {
  const [value, setValue] = useState("ru");

  return (
    <Select
      aria-label="Controlled language"
      items={LANGUAGE_ITEMS}
      value={value}
      onValueChange={setValue}
    />
  );
}

describe("Select", () => {
  it("opens on trigger interaction", async () => {
    const user = userEvent.setup();

    render(<BasicSelect />);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Language" }));

    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Russian" })).toBeInTheDocument();
  });

  it("selects an item", async () => {
    const user = userEvent.setup();

    render(<BasicSelect />);

    await user.click(screen.getByRole("combobox", { name: "Language" }));
    await user.click(await screen.findByRole("option", { name: "English" }));

    expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent("English");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("emits selected value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<BasicSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox", { name: "Language" }));
    await user.click(await screen.findByRole("option", { name: "English" }));

    expect(onValueChange).toHaveBeenCalledWith("en");
  });

  it("supports keyboard selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<BasicSelect onValueChange={onValueChange} defaultValue="ru" />);

    await user.tab();
    expect(screen.getByRole("combobox", { name: "Language" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    const listbox = await screen.findByRole("listbox");

    await user.keyboard("{ArrowDown}");
    const englishOption = within(listbox).getByRole("option", { name: "English" });

    expect(englishOption).toHaveAttribute("data-highlighted");

    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("en");
    expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent("English");
  });

  it("skips disabled item selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<BasicSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox", { name: "Language" }));
    const listbox = await screen.findByRole("listbox");
    const disabledOption = within(listbox).getByRole("option", { name: "French" });

    expect(disabledOption).toHaveAttribute("data-disabled");

    await user.click(disabledOption);

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("closes on escape", async () => {
    const user = userEvent.setup();

    render(<BasicSelect defaultValue="ru" />);

    await user.click(screen.getByRole("combobox", { name: "Language" }));
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("combobox", { name: "Language" })).toHaveFocus();
  });

  it("supports controlled value", async () => {
    const user = userEvent.setup();

    render(<ControlledSelect />);

    expect(screen.getByRole("combobox", { name: "Controlled language" })).toHaveTextContent(
      "Russian",
    );

    await user.click(screen.getByRole("combobox", { name: "Controlled language" }));
    await user.click(await screen.findByRole("option", { name: "English" }));

    expect(screen.getByRole("combobox", { name: "Controlled language" })).toHaveTextContent(
      "English",
    );
  });

  it("does not emit value changes when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select
        aria-label="Disabled language"
        items={LANGUAGE_ITEMS}
        disabled
        onValueChange={onValueChange}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Disabled language" });
    expect(trigger).toHaveAttribute("data-disabled", "true");

    await user.click(trigger);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("exposes aria-invalid when invalid", () => {
    render(<Select aria-label="Invalid language" items={LANGUAGE_ITEMS} invalid />);

    expect(screen.getByRole("combobox", { name: "Invalid language" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("forwards ref to the trigger", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Select ref={ref} aria-label="Ref language" items={LANGUAGE_ITEMS} />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("preserves caller className on trigger", () => {
    render(
      <Select
        aria-label="Styled language"
        items={LANGUAGE_ITEMS}
        className="custom-language-select"
      />,
    );

    expect(screen.getByRole("combobox", { name: "Styled language" })).toHaveClass(
      "custom-language-select",
    );
  });
});

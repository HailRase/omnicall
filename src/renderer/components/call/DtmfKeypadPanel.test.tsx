// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DtmfKeypadPanel } from "./DtmfKeypadPanel.js";

afterEach(() => {
  cleanup();
});

describe("DtmfKeypadPanel", () => {
  it("sends tone and closes panel", () => {
    const onTone = vi.fn();
    const onClose = vi.fn();
    render(
      <DtmfKeypadPanel
        displayName="+12025550100"
        toneHistory="5"
        lastTone="5"
        onTone={onTone}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByTestId("dtmf-key-3"));
    fireEvent.click(screen.getByTestId("dtmf-close"));

    expect(onTone).toHaveBeenCalledWith("3");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("dtmf-tone-history")).toHaveValue("5");
  });

  it("shows tone history when digits were sent", () => {
    render(
      <DtmfKeypadPanel
        displayName="+12025550100"
        toneHistory="123"
        lastTone="3"
        onTone={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId("dtmf-tone-history")).toHaveValue("123");
  });
});

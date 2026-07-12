// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScreenSharePickerDialog } from "./ScreenSharePickerDialog.js";

afterEach(() => {
  cleanup();
});

describe("ScreenSharePickerDialog", () => {
  it("renders sources and confirms selected source", () => {
    const onConfirm = vi.fn();
    const onSelectSource = vi.fn();
    render(
      <ScreenSharePickerDialog
        open
        loading={false}
        confirming={false}
        errorKey={null}
        activeKind="screen"
        selectedSourceId="screen:0:0"
        sources={[
          {
            id: "screen:0:0",
            name: "Entire Screen",
            kind: "screen",
            thumbnailDataUrl: null,
            appIconDataUrl: null,
          },
        ]}
        onActiveKindChange={vi.fn()}
        onSelectSource={onSelectSource}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("screen-share-picker-dialog")).toBeInTheDocument();
    expect(screen.getByText("Entire Screen")).toBeInTheDocument();
    expect(screen.getByTestId("screen-share-picker-tab-chrome-tab")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("screen-share-picker-source-screen:0:0"));
    expect(onSelectSource).toHaveBeenCalledWith("screen:0:0");
    fireEvent.click(screen.getByTestId("screen-share-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("falls back to app icon when thumbnail is missing", () => {
    render(
      <ScreenSharePickerDialog
        open
        loading={false}
        confirming={false}
        errorKey={null}
        activeKind="chromeTab"
        selectedSourceId="window:1:0"
        sources={[
          {
            id: "window:1:0",
            name: "Notes",
            kind: "window",
            thumbnailDataUrl: null,
            appIconDataUrl: "data:image/png;base64,aaa",
          },
        ]}
        onActiveKindChange={vi.fn()}
        onSelectSource={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(document.querySelector('img[src="data:image/png;base64,aaa"]')).toBeInTheDocument();
  });

  it("disables confirm while loading or without selection", () => {
    render(
      <ScreenSharePickerDialog
        open
        loading
        confirming={false}
        errorKey={null}
        activeKind="screen"
        selectedSourceId={null}
        sources={[]}
        onActiveKindChange={vi.fn()}
        onSelectSource={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("screen-share-picker-confirm")).toBeDisabled();
  });
});

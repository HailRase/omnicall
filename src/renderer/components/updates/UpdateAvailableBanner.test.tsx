// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpdateAvailableBanner } from "./UpdateAvailableBanner.js";

afterEach(() => {
  cleanup();
});

const baseProps = {
  visible: true,
  latestVersion: "2.0.0",
  canOpenReleaseNotes: false,
  onDownload: vi.fn(),
  onReleaseNotes: vi.fn(),
  onDismiss: vi.fn(),
};

describe("UpdateAvailableBanner", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <UpdateAvailableBanner {...baseProps} visible={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders update message with latest version", () => {
    render(<UpdateAvailableBanner {...baseProps} />);

    expect(screen.getByTestId("update-available-banner")).toBeInTheDocument();
    expect(screen.getByTestId("update-available-banner-message")).toHaveTextContent("2.0.0");
  });

  it("calls download callback from primary action", () => {
    const onDownload = vi.fn();
    render(<UpdateAvailableBanner {...baseProps} onDownload={onDownload} />);

    screen.getByTestId("update-available-banner-download").click();
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss callback from later action", () => {
    const onDismiss = vi.fn();
    render(<UpdateAvailableBanner {...baseProps} onDismiss={onDismiss} />);

    screen.getByTestId("update-available-banner-later").click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("shows release notes action when available", () => {
    const onReleaseNotes = vi.fn();
    render(
      <UpdateAvailableBanner
        {...baseProps}
        canOpenReleaseNotes
        onReleaseNotes={onReleaseNotes}
      />,
    );

    screen.getByTestId("update-available-banner-release-notes").click();
    expect(onReleaseNotes).toHaveBeenCalledTimes(1);
  });
});

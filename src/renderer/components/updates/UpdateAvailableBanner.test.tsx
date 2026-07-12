// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpdateAvailableBanner } from "./UpdateAvailableBanner.js";
import styles from "./UpdateAvailableBanner.module.css";

afterEach(() => {
  cleanup();
});

const baseProps = {
  visible: true,
  latestVersion: "2.0.0",
  onDownload: vi.fn(),
  onDismiss: vi.fn(),
};

describe("UpdateAvailableBanner", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <UpdateAvailableBanner {...baseProps} visible={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders overlay card with title and latest version", () => {
    render(<UpdateAvailableBanner {...baseProps} />);

    expect(screen.getByTestId("update-available-banner-anchor")).toBeInTheDocument();
    expect(screen.getByTestId("update-available-banner")).toBeInTheDocument();
    expect(screen.getByText("Доступно обновление")).toBeInTheDocument();
    expect(screen.getByTestId("update-available-banner-message")).toHaveTextContent("2.0.0");
    expect(screen.getByTestId("update-available-banner-download")).toBeInTheDocument();
    expect(screen.getByTestId("update-available-banner-later")).toBeInTheDocument();
    expect(screen.queryByTestId("update-available-banner-dismiss")).not.toBeInTheDocument();
    expect(screen.queryByTestId("update-available-banner-release-notes")).not.toBeInTheDocument();
    expect(screen.queryByTestId("update-available-banner-backdrop")).not.toBeInTheDocument();
  });

  it("anchors below shell window controls via shared banner top token class", () => {
    render(<UpdateAvailableBanner {...baseProps} />);

    expect(screen.getByTestId("update-available-banner-anchor")).toHaveClass(styles.anchor);
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
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransferSuccessOverlay } from "./TransferSuccessOverlay.js";

describe("TransferSuccessOverlay", () => {
  it("renders centered success copy", () => {
    render(<TransferSuccessOverlay visible exiting={false} />);

    expect(screen.getByTestId("transfer-success-overlay")).toBeInTheDocument();
    expect(screen.getByText("Перевод выполнен успешно")).toBeInTheDocument();
    expect(screen.queryByTestId("transfer-success-dismiss")).not.toBeInTheDocument();
  });

  it("returns null when not visible", () => {
    const { container } = render(<TransferSuccessOverlay visible={false} exiting={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});

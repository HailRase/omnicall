// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OcpToastStack } from "./OcpToastStack.js";

afterEach(() => {
  cleanup();
});

describe("OcpToastStack", () => {
  it("renders nothing when no toasts", () => {
    const { container } = render(<OcpToastStack toasts={[]} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders toast with test id and dismiss", () => {
    const onDismiss = vi.fn();
    render(
      <OcpToastStack
        toasts={[
          {
            id: "t1",
            message: "Queue updated",
            level: "info",
            receivedAt: new Date().toISOString(),
          },
        ]}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId("ocp-toast")).toHaveTextContent("Queue updated");
    screen.getByRole("button", { name: "Закрыть уведомление" }).click();
    expect(onDismiss).toHaveBeenCalledWith("t1");
  });
});

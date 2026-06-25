// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QueueInfoLabel } from "./QueueInfoLabel.js";

afterEach(() => {
  cleanup();
});

describe("QueueInfoLabel", () => {
  it("renders nothing when hidden", () => {
    const { container } = render(
      <QueueInfoLabel labelState="hidden" queueName={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders pending with aria-busy when loading", () => {
    render(<QueueInfoLabel labelState="loading" queueName={null} />);
    const label = screen.getByTestId("queue-info-label");
    expect(label).toHaveTextContent("Ожидание");
    expect(label).toHaveAttribute("aria-busy", "true");
    expect(label).toHaveAttribute("aria-label", "Очередь");
  });

  it("renders queue name when ready", () => {
    render(<QueueInfoLabel labelState="ready" queueName="VIP Queue" />);
    const label = screen.getByTestId("queue-info-label");
    expect(label).toHaveTextContent("VIP Queue");
    expect(label).toHaveAttribute("aria-busy", "false");
  });

  it("renders N/A when na", () => {
    render(<QueueInfoLabel labelState="na" queueName={null} />);
    const label = screen.getByTestId("queue-info-label");
    expect(label).toHaveTextContent("Н/Д");
    expect(label).toHaveAttribute("aria-busy", "false");
  });
});

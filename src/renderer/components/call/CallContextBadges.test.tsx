// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CallContextBadges } from "./CallContextBadges.js";

describe("CallContextBadges", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing for empty list", () => {
    const { container } = render(<CallContextBadges badges={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders queue and campaign badges", () => {
    render(
      <CallContextBadges
        badges={[
          { kind: "queue", value: "Support" },
          { kind: "progressive" },
          { kind: "company", value: "Acme" },
        ]}
      />,
    );
    expect(screen.getByTestId("call-context-badges")).toBeInTheDocument();
    expect(screen.getByTestId("queue-info-label")).toHaveTextContent("Support");
    expect(screen.getAllByTestId("incoming-campaign-context").length).toBeGreaterThanOrEqual(2);
  });

  it("renders pending skeleton", () => {
    render(<CallContextBadges badges={[{ kind: "queuePending" }]} />);
    expect(screen.getByTestId("queue-info-label")).toHaveAttribute(
      "data-state",
      "pending",
    );
  });
});

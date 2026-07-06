// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "./Badge.js";
import styles from "./Badge.module.css";

afterEach(() => {
  cleanup();
});

describe("Badge", () => {
  it("renders content", () => {
    render(<Badge>Active</Badge>);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <Badge iconId="operator.ready" data-testid="badge-with-icon">
        Ready
      </Badge>,
    );

    const badge = screen.getByTestId("badge-with-icon");
    expect(badge.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("applies tone class", () => {
    render(
      <Badge tone="success" data-testid="success-badge">
        Connected
      </Badge>,
    );

    const badge = screen.getByTestId("success-badge");
    expect(badge).toHaveClass(styles.toneSuccess ?? "");
    expect(badge).toHaveAttribute("data-tone", "success");
  });

  it("applies size class and preserves className", () => {
    render(
      <Badge size="sm" className="custom-badge" data-testid="small-badge">
        Small
      </Badge>,
    );

    const badge = screen.getByTestId("small-badge");
    expect(badge).toHaveClass(styles.sizeSm ?? "");
    expect(badge).toHaveClass("custom-badge");
    expect(badge).toHaveAttribute("data-size", "sm");
  });

  it("forwards ref to the root span", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Badge ref={ref}>Ref badge</Badge>);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toHaveTextContent("Ref badge");
  });

  it("keeps icon decorative when text is present", () => {
    render(
      <Badge iconId="call.incoming" data-testid="decorative-icon-badge">
        Incoming
      </Badge>,
    );

    const iconWrapper = screen.getByTestId("decorative-icon-badge").querySelector("[aria-hidden='true']");
    expect(iconWrapper).toBeInTheDocument();
  });

  it("does not expose misleading status role by default", () => {
    render(<Badge tone="destructive">Failed</Badge>);

    expect(screen.getByText("Failed")).not.toHaveAttribute("role", "status");
    expect(screen.getByText("Failed")).not.toHaveAttribute("role", "alert");
  });
});

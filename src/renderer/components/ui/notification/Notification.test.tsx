// @vitest-environment jsdom
import type { JSX } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../button/Button.js";
import { Notification } from "./Notification.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function BasicNotification({
  tone = "default",
  withMessage = true,
  withActions = false,
  withMetadata = false,
  closable = false,
  onClose,
}: Readonly<{
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  withMessage?: boolean;
  withActions?: boolean;
  withMetadata?: boolean;
  closable?: boolean;
  onClose?: () => void;
}>): JSX.Element {
  return (
    <Notification
      tone={tone}
      title="Connection restored"
      {...(withMessage ? { message: "SIP registration is active again." } : {})}
      {...(withMetadata ? { metadata: <span>Posted just now</span> } : {})}
      {...(withActions
        ? {
            actions: (
              <Button size="sm" variant="outline">
                Retry
              </Button>
            ),
          }
        : {})}
      {...(closable
        ? { closable: true, closeLabel: "Dismiss notification", onClose }
        : {})}
    />
  );
}

describe("Notification", () => {
  it("renders title and message", () => {
    render(<BasicNotification />);

    expect(screen.getByText("Connection restored")).toBeInTheDocument();
    expect(screen.getByText("SIP registration is active again.")).toBeInTheDocument();
  });

  it("calls close", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<BasicNotification closable onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders actions", () => {
    render(<BasicNotification withActions />);

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders metadata slot", () => {
    render(<BasicNotification withMetadata />);

    expect(screen.getByText("Posted just now")).toBeInTheDocument();
  });

  it("uses status role for non-destructive tones", () => {
    render(<BasicNotification tone="success" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uses alert role for destructive tone", () => {
    render(<BasicNotification tone="destructive" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("forwards ref to the notification root", () => {
    const ref = vi.fn();

    render(<Notification ref={ref} title="Ref notification" />);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0]?.[0]).toBeInstanceOf(HTMLElement);
  });

  it("preserves caller className on root", () => {
    render(
      <Notification title="Styled notification" className="custom-notification" />,
    );

    expect(screen.getByText("Styled notification").closest("article")).toHaveClass(
      "custom-notification",
    );
  });

  it("applies tone data attribute", () => {
    render(<BasicNotification tone="info" />);

    expect(screen.getByText("Connection restored").closest("article")).toHaveAttribute(
      "data-tone",
      "info",
    );
  });

  it("protects internally controlled tone and role from native prop override", () => {
    render(
      <Notification
        title="Protected notification"
        tone="destructive"
        data-tone="default"
        role="status"
      />,
    );

    const root = screen.getByText("Protected notification").closest("article");
    expect(root).toHaveAttribute("data-tone", "destructive");
    expect(root).toHaveAttribute("role", "alert");
  });
});

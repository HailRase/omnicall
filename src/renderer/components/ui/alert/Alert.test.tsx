// @vitest-environment jsdom
import type { JSX } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { AppIcon } from "../../icons/AppIcon.js";
import { Button } from "../button/Button.js";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "./Alert.js";
import styles from "./Alert.module.css";

afterEach(() => {
  cleanup();
});

function BasicAlert({
  variant = "default",
  withIcon = false,
  withAction = false,
}: Readonly<{
  variant?: "default" | "destructive";
  withIcon?: boolean;
  withAction?: boolean;
}>): JSX.Element {
  return (
    <Alert variant={variant}>
      {withIcon ? <AppIcon id="operator.break" size={16} decorative /> : null}
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
      {withAction ? (
        <AlertAction>
          <Button size="sm" variant="outline">
            View details
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}

describe("Alert", () => {
  it("renders title and description", () => {
    render(<BasicAlert />);

    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(
      screen.getByText("You can add components to your app using the CLI."),
    ).toBeInTheDocument();
  });

  it("exposes role=\"alert\" on root", () => {
    render(<BasicAlert />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    render(
      <Alert variant="destructive" data-testid="destructive-alert">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Destructive copy.</AlertDescription>
      </Alert>,
    );

    const root = screen.getByTestId("destructive-alert");
    expect(root).toHaveClass(styles.variantDestructive ?? "");
    expect(root).toHaveAttribute("data-variant", "destructive");
  });

  it("renders icon and action slots", () => {
    render(<BasicAlert withIcon withAction />);

    expect(screen.getByRole("alert").querySelector("svg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View details" })).toBeInTheDocument();
  });

  it("forwards refs on documented slots", () => {
    const rootRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLDivElement>();
    const descriptionRef = createRef<HTMLDivElement>();
    const actionRef = createRef<HTMLDivElement>();

    render(
      <Alert ref={rootRef}>
        <AlertTitle ref={titleRef}>Title</AlertTitle>
        <AlertDescription ref={descriptionRef}>Description</AlertDescription>
        <AlertAction ref={actionRef}>
          <Button size="sm" variant="outline">
            Action
          </Button>
        </AlertAction>
      </Alert>,
    );

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(titleRef.current).toHaveTextContent("Title");
    expect(descriptionRef.current).toHaveTextContent("Description");
    expect(actionRef.current).toContainElement(
      screen.getByRole("button", { name: "Action" }),
    );
  });

  it("preserves caller className", () => {
    render(
      <Alert className="custom-alert" data-testid="styled-alert">
        <AlertTitle className="custom-title">Title</AlertTitle>
        <AlertDescription className="custom-description">Description</AlertDescription>
        <AlertAction className="custom-action">
          <Button size="sm" variant="outline">
            Action
          </Button>
        </AlertAction>
      </Alert>,
    );

    expect(screen.getByTestId("styled-alert")).toHaveClass("custom-alert");
    expect(screen.getByText("Title")).toHaveClass("custom-title");
    expect(screen.getByText("Description")).toHaveClass("custom-description");
    expect(screen.getByRole("button", { name: "Action" }).parentElement).toHaveClass(
      "custom-action",
    );
  });

  it("protects internally controlled role and variant from native prop override", () => {
    render(
      <Alert variant="destructive" role="status" data-variant="default">
        <AlertTitle>Protected alert</AlertTitle>
      </Alert>,
    );

    const root = screen.getByRole("alert");
    expect(root).toHaveAttribute("data-variant", "destructive");
    expect(root).not.toHaveAttribute("role", "status");
  });

  it("keeps leading icon decorative when title is present", () => {
    render(<BasicAlert withIcon />);

    const decorativeIcon = screen
      .getByRole("alert")
      .querySelector("[aria-hidden='true']");
    expect(decorativeIcon).toBeInTheDocument();
  });

  it("exposes data-slot markers for composable layout", () => {
    render(<BasicAlert withIcon withAction />);

    const root = screen.getByRole("alert");
    expect(root).toHaveAttribute("data-slot", "alert");
    expect(screen.getByText("Heads up")).toHaveAttribute("data-slot", "alert-title");
    expect(
      screen.getByText("You can add components to your app using the CLI."),
    ).toHaveAttribute("data-slot", "alert-description");
    expect(screen.getByRole("button", { name: "View details" }).parentElement).toHaveAttribute(
      "data-slot",
      "alert-action",
    );
  });

  it("positions action slot outside the content grid flow", () => {
    render(<BasicAlert withAction />);

    const action = screen.getByRole("button", { name: "View details" }).parentElement;
    expect(action).toHaveClass(styles.action ?? "");
  });

  it("reserves action overlay without occupying a grid row", () => {
    render(<BasicAlert withAction />);

    const root = screen.getByRole("alert");
    const action = screen.getByRole("button", { name: "View details" }).parentElement;

    expect(root.children).toHaveLength(3);
    expect(action).toHaveAttribute("data-slot", "alert-action");
    expect(action).toHaveClass(styles.action ?? "");
  });

  it("keeps title and description in the content grid column", () => {
    render(<BasicAlert withIcon />);

    expect(screen.getByText("Heads up")).toHaveClass(styles.title ?? "");
    expect(
      screen.getByText("You can add components to your app using the CLI."),
    ).toHaveClass(styles.description ?? "");
  });
});

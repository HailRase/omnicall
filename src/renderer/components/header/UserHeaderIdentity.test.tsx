// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UserHeaderIdentity } from "./UserHeaderIdentity.js";

afterEach(() => {
  cleanup();
});

describe("UserHeaderIdentity", () => {
  it("renders display name and presence status", () => {
    render(
      <UserHeaderIdentity
        displayName="alex.operator"
        presenceStatusLabel="Онлайн"
        presenceStatusTone="online"
      />,
    );

    expect(screen.getByTestId("user-header-identity")).toHaveTextContent("alex.operator");
    expect(screen.getByTestId("user-presence-status")).toHaveTextContent("Онлайн");
    expect(screen.getByTestId("user-presence-status")).toHaveAttribute("data-tone", "online");
  });
});

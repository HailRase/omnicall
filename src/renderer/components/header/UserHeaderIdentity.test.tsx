// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UserHeaderIdentity } from "./UserHeaderIdentity.js";

afterEach(() => {
  cleanup();
});

describe("UserHeaderIdentity", () => {
  it("renders display name and SIP status line", () => {
    render(
      <UserHeaderIdentity
        displayName="alex.operator"
        sipStatusLabel="Зарегистрирован"
        sipStatusTimerSuffix={null}
        sipStatusTone="registered"
      />,
    );

    expect(screen.getByTestId("user-header-identity")).toHaveTextContent("alex.operator");
    expect(screen.getByTestId("user-sip-status")).toHaveTextContent("Зарегистрирован");
    expect(screen.getByTestId("user-sip-status")).toHaveAttribute("data-tone", "registered");
  });

  it("renders recovery timer on a separate line without truncating digits", () => {
    render(
      <UserHeaderIdentity
        displayName="agent"
        sipStatusLabel="Не зарегистрирован"
        sipStatusTimerSuffix="04:59"
        sipStatusTone="not_registered"
      />,
    );

    expect(screen.getByTestId("user-sip-status")).toHaveTextContent("Не зарегистрирован");
    expect(screen.getByTestId("user-sip-status-timer")).toHaveTextContent("04:59");
  });
});

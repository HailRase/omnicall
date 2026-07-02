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

  it("appends recovery timer suffix to SIP status", () => {
    render(
      <UserHeaderIdentity
        displayName="agent"
        sipStatusLabel="Нет соединения"
        sipStatusTimerSuffix="(переподкл. 00:45)"
        sipStatusTone="reconnecting"
      />,
    );

    expect(screen.getByTestId("user-sip-status")).toHaveTextContent(
      "Нет соединения (переподкл. 00:45)",
    );
  });
});

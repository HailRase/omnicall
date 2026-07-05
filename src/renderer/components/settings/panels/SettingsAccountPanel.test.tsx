// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsAccountPanel } from "./SettingsAccountPanel.js";

afterEach(() => {
  cleanup();
});

const baseProps = {
  form: {
    username: "1001",
    password: "secret",
    domain: "pbx.example.com",
    server: "wss://sip.example.com",
  },
  submitting: false,
  error: null,
  successKey: null,
  disabled: false,
  authorizeDisabledReason: "Вы уже в сети. Для смены аккаунта нажмите «Выйти»",
  logoutDisabledReason: null,
  onFieldChange: vi.fn(),
  onSubmit: vi.fn(),
  onLogout: vi.fn(),
} as const;

describe("SettingsAccountPanel", () => {
  it("renders embedded account authorization form", () => {
    render(<SettingsAccountPanel {...baseProps} />);

    expect(screen.getByTestId("settings-account-panel")).toBeInTheDocument();
    expect(screen.getByTestId("account-panel")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1001")).toBeInTheDocument();
  });
});

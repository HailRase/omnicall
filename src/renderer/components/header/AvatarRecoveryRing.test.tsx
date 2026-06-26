// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvatarRecoveryRing } from "./AvatarRecoveryRing.js";

afterEach(() => {
  cleanup();
});

describe("AvatarRecoveryRing", () => {
  it("hides ring and countdown when not visible", () => {
    render(
      <AvatarRecoveryRing
        visible={false}
        tone="failed"
        overlayMode="countdown"
        countdownSeconds={5}
      >
        <span data-testid="avatar-child">AB</span>
      </AvatarRecoveryRing>,
    );

    expect(screen.getByTestId("avatar-recovery-ring")).toHaveAttribute("data-visible", "false");
    expect(screen.queryByTestId("avatar-recovery-countdown")).not.toBeInTheDocument();
    expect(screen.getByTestId("avatar-child")).toBeInTheDocument();
  });

  it("shows countdown centered on avatar with blur overlay", () => {
    render(
      <AvatarRecoveryRing visible tone="failed" overlayMode="countdown" countdownSeconds={12}>
        <span data-testid="avatar-child">AB</span>
      </AvatarRecoveryRing>,
    );

    const host = screen.getByTestId("avatar-recovery-ring");
    const countdown = screen.getByTestId("avatar-recovery-countdown");
    expect(countdown).toHaveTextContent("12");
    expect(host.contains(screen.getByTestId("avatar-child"))).toBe(true);
    expect(host).toHaveAttribute("data-overlay", "countdown");
    expect(screen.getByLabelText("Перерегистрация, осталось 12 секунд")).toBeInTheDocument();
  });

  it("formats countdown above one minute as m:ss", () => {
    render(
      <AvatarRecoveryRing visible tone="failed" overlayMode="countdown" countdownSeconds={75}>
        <span>AB</span>
      </AvatarRecoveryRing>,
    );

    expect(screen.getByTestId("avatar-recovery-countdown")).toHaveTextContent("1:15");
  });

  it("exposes in-progress aria label when overlay mode is in_progress", () => {
    render(
      <AvatarRecoveryRing visible tone="failed" overlayMode="in_progress" countdownSeconds={null}>
        <span>AB</span>
      </AvatarRecoveryRing>,
    );

    expect(screen.queryByTestId("avatar-recovery-countdown")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Перерегистрация выполняется")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-recovery-ring")).toHaveAttribute("data-overlay", "in_progress");
  });

  it("shows reload control on avatar when overlay mode is reload", () => {
    const onReload = vi.fn();
    render(
      <AvatarRecoveryRing
        visible
        tone="failed"
        overlayMode="reload"
        countdownSeconds={null}
        onReload={onReload}
      >
        <span>AB</span>
      </AvatarRecoveryRing>,
    );

    const reload = screen.getByTestId("avatar-recovery-reload");
    expect(reload).toHaveAttribute("aria-label", "Перерегистрация SIP");
    fireEvent.click(reload);
    expect(onReload).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Ошибка регистрации SIP. Нажмите для перерегистрации")).toBeInTheDocument();
  });
});

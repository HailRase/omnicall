// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AvatarRecoveryRing } from "./AvatarRecoveryRing.js";

afterEach(() => {
  cleanup();
});

describe("AvatarRecoveryRing", () => {
  it("hides ring and countdown when not visible", () => {
    render(
      <AvatarRecoveryRing visible={false} countdownSeconds={5} inProgress={false}>
        <span data-testid="avatar-child">AB</span>
      </AvatarRecoveryRing>,
    );

    expect(screen.getByTestId("avatar-recovery-ring")).toHaveAttribute("data-visible", "false");
    expect(screen.queryByTestId("avatar-recovery-countdown")).not.toBeInTheDocument();
    expect(screen.getByTestId("avatar-child")).toBeInTheDocument();
  });

  it("shows countdown on ring without attempt labels", () => {
    render(
      <AvatarRecoveryRing visible countdownSeconds={12} inProgress={false}>
        <span>AB</span>
      </AvatarRecoveryRing>,
    );

    expect(screen.getByTestId("avatar-recovery-countdown")).toHaveTextContent("12");
    expect(screen.getByLabelText("Перерегистрация, осталось 12 секунд")).toBeInTheDocument();
  });

  it("formats countdown above one minute as m:ss", () => {
    render(
      <AvatarRecoveryRing visible countdownSeconds={75} inProgress={false}>
        <span>AB</span>
      </AvatarRecoveryRing>,
    );

    expect(screen.getByTestId("avatar-recovery-countdown")).toHaveTextContent("1:15");
  });

  it("exposes in-progress aria label when countdown is absent", () => {
    render(
      <AvatarRecoveryRing visible countdownSeconds={null} inProgress>
        <span>AB</span>
      </AvatarRecoveryRing>,
    );

    expect(screen.queryByTestId("avatar-recovery-countdown")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Перерегистрация выполняется")).toBeInTheDocument();
  });
});

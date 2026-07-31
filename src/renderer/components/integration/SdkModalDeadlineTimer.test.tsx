// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { SdkModalDeadlineTimer } from "./SdkModalDeadlineTimer.js";

describe("SdkModalDeadlineTimer", () => {
  beforeEach(() => {
    setRendererLanguage("en");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-23T12:00:00.000Z"));
  });

  afterEach(() => {
    cleanup();
    setRendererLanguage("ru");
    vi.useRealTimers();
  });

  it("renders MM:SS and fires onExpired once at zero", () => {
    const onExpired = vi.fn();
    render(
      <SdkModalDeadlineTimer
        expiresAt="2026-07-23T12:00:30.000Z"
        onExpired={onExpired}
        testId="deadline"
      />,
    );
    expect(screen.getByTestId("deadline")).toHaveTextContent("00:30");

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByTestId("deadline")).toHaveTextContent("00:00");
    expect(onExpired).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});

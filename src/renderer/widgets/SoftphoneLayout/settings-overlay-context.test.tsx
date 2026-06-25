// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsOverlay } from "../../components/settings/SettingsOverlay.js";
import { ShellOverlaySheet } from "../../components/shell/ShellOverlaySheet.js";
import { SoftphoneLayout } from "./SoftphoneLayout.js";

describe("settings overlay with layout zones", () => {
  it("keeps call context mounted while settings sheet is open", () => {
    render(
      <SoftphoneLayout
        header={<span>Header</span>}
        context={<div data-testid="call-context-zone">Call context</div>}
        controls={<span>Controls</span>}
        overlays={
          <ShellOverlaySheet
            open
            title="Settings"
            testId="settings-overlay"
            onClose={() => undefined}
          >
            <SettingsOverlay
              multiSessionsEnabled
              onMultiSessionsChange={() => undefined}
              sipAutoReregisterEnabled
              onSipAutoReregisterChange={() => undefined}
              sipReregisterIntervalSec={5}
              onSipReregisterIntervalChange={() => undefined}
            />
          </ShellOverlaySheet>
        }
      />,
    );

    expect(screen.getByTestId("call-context-zone")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay-body")).toBeInTheDocument();
  });
});

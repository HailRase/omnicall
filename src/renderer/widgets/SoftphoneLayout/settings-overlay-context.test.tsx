// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsFullscreenOverlay } from "../../components/settings/SettingsFullscreenOverlay.js";
import { SettingsPanel } from "../../components/settings/SettingsPanel.js";
import { systemStateTestDefaults } from "../../components/settings/panels/settingsSystemStateTestDefaults.js";
import { SoftphoneLayout } from "./SoftphoneLayout.js";

describe("settings overlay with layout zones", () => {
  it("keeps call context mounted while settings overlay is open", () => {
    render(
      <SoftphoneLayout
        header={<span>Header</span>}
        context={<div data-testid="call-context-zone">Call context</div>}
        controls={<span>Controls</span>}
        overlays={
          <SettingsFullscreenOverlay open onClose={() => undefined}>
            <SettingsPanel
              activeSection="sessions"
              sidebarExpanded={false}
              onClose={() => undefined}
              onSectionChange={vi.fn()}
              onSidebarExpandedChange={vi.fn()}
              theme="light"
              onThemeChange={() => undefined}
              multiSessionsEnabled
              onMultiSessionsChange={() => undefined}
              autoAnswerEnabled={false}
              autoAnswerTimeoutSec={5}
              onAutoAnswerEnabledChange={() => undefined}
              onAutoAnswerTimeoutChange={() => undefined}
              autoAnswerDuringActiveSessionEnabled={false}
              onAutoAnswerDuringActiveSessionChange={() => undefined}
              systemState={systemStateTestDefaults}
              currentVersion="0.0.1"
              latestVersion={undefined}
              updateStatusMessage="Нажмите «Проверить обновления», чтобы узнать о новой версии."
              canCheckForUpdates
              canOpenDownloadPage={false}
              isCheckingUpdates={false}
              onCheckForUpdates={() => undefined}
              onOpenDownloadPage={() => undefined}
              account={{
                form: { username: "", password: "", domain: "", server: "" },
                submitting: false,
                error: null,
                disabled: false,
                authorizeDisabledReason: null,
                logoutDisabledReason: "Заполните поля и нажмите «Авторизоваться»",
                onFieldChange: vi.fn(),
                onSubmit: vi.fn(),
                onLogout: vi.fn(),
              }}
            />
          </SettingsFullscreenOverlay>
        }
      />,
    );

    expect(screen.getByTestId("call-context-zone")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay-body")).toBeInTheDocument();
  });
});

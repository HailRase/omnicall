import type { JSX, ReactNode } from "react";
import type { AppTheme, SipAccountInput } from "@application/index.js";
import { IconControlButton } from "../icons/index.js";
import type { SettingsSectionId } from "./settingsSections.js";
import { resolveSettingsContentHeaderTitle } from "./settingsSections.js";
import { SettingsSidebar } from "./SettingsSidebar.js";
import { SettingsAccountPanel } from "./panels/SettingsAccountPanel.js";
import { SettingsCodecsPanel } from "./panels/SettingsCodecsPanel.js";
import { SettingsDiagnosticsPanel } from "./panels/SettingsDiagnosticsPanel.js";
import { SettingsGeneralPanel } from "./panels/SettingsGeneralPanel.js";
import { SettingsHeadsetPanel } from "./panels/SettingsHeadsetPanel.js";
import { SettingsSessionsPanel } from "./panels/SettingsSessionsPanel.js";
import formStyles from "./SettingsForm.module.css";
import styles from "./SettingsPanel.module.css";

export type SettingsPanelProps = Readonly<{
  activeSection: SettingsSectionId;
  sidebarExpanded: boolean;
  onClose: () => void;
  onSectionChange: (sectionId: SettingsSectionId) => void;
  onSidebarExpandedChange: (expanded: boolean) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  multiSessionsEnabled: boolean;
  onMultiSessionsChange: (enabled: boolean) => void;
  sipAutoReregisterEnabled: boolean;
  onSipAutoReregisterChange: (enabled: boolean) => void;
  sipReregisterIntervalSec: number;
  onSipReregisterIntervalChange: (intervalSec: number) => void;
  updateError?: string | null;
  account: Readonly<{
    form: SipAccountInput;
    submitting: boolean;
    error: string | null;
    disabled: boolean;
    authorizeDisabledReason: string | null;
    logoutDisabledReason: string | null;
    onFieldChange: (field: keyof SipAccountInput, value: string) => void;
    onSubmit: () => void;
    onLogout: () => void;
  }>;
}>;

/**
 * - Purpose: compose settings sidebar and section panels inside fullscreen overlay.
 * - Inputs: active section, sidebar state, settings and account callbacks.
 * - Outputs: sectioned settings layout without facade or repository access.
 * @uiMeta lf=LF-032,LF-076,LF-008 f=F-016,F-014,F-017 smoke=R7-5
 */
export function SettingsPanel({
  activeSection,
  sidebarExpanded,
  onClose,
  onSectionChange,
  onSidebarExpandedChange,
  theme,
  onThemeChange,
  multiSessionsEnabled,
  onMultiSessionsChange,
  sipAutoReregisterEnabled,
  onSipAutoReregisterChange,
  sipReregisterIntervalSec,
  onSipReregisterIntervalChange,
  updateError = null,
  account,
}: SettingsPanelProps): JSX.Element {
  const handleToggleSidebar = (): void => {
    onSidebarExpandedChange(!sidebarExpanded);
  };

  let sectionContent: ReactNode;
  switch (activeSection) {
    case "account":
      sectionContent = (
        <SettingsAccountPanel
          form={account.form}
          submitting={account.submitting}
          error={account.error}
          disabled={account.disabled}
          authorizeDisabledReason={account.authorizeDisabledReason}
          logoutDisabledReason={account.logoutDisabledReason}
          onFieldChange={account.onFieldChange}
          onSubmit={account.onSubmit}
          onLogout={account.onLogout}
        />
      );
      break;
    case "general":
      sectionContent = (
        <SettingsGeneralPanel
          theme={theme}
          onThemeChange={onThemeChange}
          sipAutoReregisterEnabled={sipAutoReregisterEnabled}
          onSipAutoReregisterChange={onSipAutoReregisterChange}
          sipReregisterIntervalSec={sipReregisterIntervalSec}
          onSipReregisterIntervalChange={onSipReregisterIntervalChange}
        />
      );
      break;
    case "sessions":
      sectionContent = (
        <SettingsSessionsPanel
          multiSessionsEnabled={multiSessionsEnabled}
          onMultiSessionsChange={onMultiSessionsChange}
        />
      );
      break;
    case "diagnostics":
      sectionContent = <SettingsDiagnosticsPanel />;
      break;
    case "codecs":
      sectionContent = <SettingsCodecsPanel />;
      break;
    case "headset":
      sectionContent = <SettingsHeadsetPanel />;
      break;
    default: {
      const exhaustive: never = activeSection;
      throw new Error(`Unsupported settings section: ${String(exhaustive)}`);
    }
  }

  return (
    <div className={styles["layout"]} data-testid="settings-overlay-body">
      <SettingsSidebar
        activeSection={activeSection}
        expanded={sidebarExpanded}
        onSectionChange={onSectionChange}
        onToggleExpanded={handleToggleSidebar}
      />
      <div className={styles["content"]}>
        <header className={styles["contentHeader"]}>
          <h3 className={styles["contentTitle"]} data-testid="settings-section-title">
            {resolveSettingsContentHeaderTitle(activeSection)}
          </h3>
          <div className={styles["closeSlot"]}>
            <IconControlButton
              iconId="overlay.close"
              ariaLabel="Закрыть настройки"
              testId="settings-overlay-close"
              className={styles["closeButton"]}
              onClick={onClose}
            />
          </div>
        </header>
        {updateError !== null ? (
          <p className={formStyles["error"]} role="alert" data-testid="settings-update-error">
            {updateError}
          </p>
        ) : null}
        <div className={styles["contentBody"]}>{sectionContent}</div>
      </div>
    </div>
  );
}

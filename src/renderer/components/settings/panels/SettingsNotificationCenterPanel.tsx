import { useState, type JSX } from "react";
import type {
  NotificationPlacement,
  NotificationRaiseWindowMode,
  NotificationStacking,
  UserNotificationLevel,
  UserNotificationModule,
  UserNotificationPreferences,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { Tabs, TabsList, TabsTrigger } from "../../ui/index.js";
import type { NotificationHistoryQuery } from "./SettingsNotificationHistoryPanel.js";
import { SettingsNotificationHistoryPanel } from "./SettingsNotificationHistoryPanel.js";
import { SettingsNotificationAppearancePanel } from "./SettingsNotificationAppearancePanel.js";
import { SettingsNotificationPreferencesPanel } from "./SettingsNotificationPreferencesPanel.js";
import type {
  NotificationCenterTabId,
  NotificationPreferencesPresetId,
} from "./notificationPreferencesUi.js";
import styles from "./SettingsNotificationCenterPanel.module.css";

export type SettingsNotificationCenterPanelProps = Readonly<{
  preferences: UserNotificationPreferences;
  onMasterInAppPopupEnabledChange: (enabled: boolean) => void;
  onModuleEnabledChange: (
    module: UserNotificationModule,
    enabled: boolean,
  ) => void;
  onModuleMinLevelChange: (
    module: UserNotificationModule,
    minLevel: UserNotificationLevel,
  ) => void;
  onModuleRaiseWindowChange: (
    module: UserNotificationModule,
    raiseWindow: NotificationRaiseWindowMode,
  ) => void;
  onApplyPreset: (preset: NotificationPreferencesPresetId) => void;
  notificationPlacement: NotificationPlacement;
  onNotificationPlacementChange: (placement: NotificationPlacement) => void;
  notificationStacking: NotificationStacking;
  onNotificationStackingChange: (stacking: NotificationStacking) => void;
  notificationDurationMs: number;
  onNotificationDurationMsChange: (durationMs: number) => void;
  notificationMaxVisible: number;
  onNotificationMaxVisibleChange: (maxVisible: number) => void;
  notificationClosable: boolean;
  onNotificationClosableChange: (closable: boolean) => void;
  activeTab?: NotificationCenterTabId;
  onActiveTabChange?: (tab: NotificationCenterTabId) => void;
  notificationHistoryQuery?: NotificationHistoryQuery;
}>;

/**
 * - Purpose: Settings Notification Center hub with Preferences / Appearance / History.
 * - Inputs: preference/appearance callbacks, optional controlled tab, optional history query.
 * - Outputs: tabbed presentational shell without capture policy logic.
 * @uiMeta lf=LF-060 f=F-034
 */
export function SettingsNotificationCenterPanel({
  preferences,
  onMasterInAppPopupEnabledChange,
  onModuleEnabledChange,
  onModuleMinLevelChange,
  onModuleRaiseWindowChange,
  onApplyPreset,
  notificationPlacement,
  onNotificationPlacementChange,
  notificationStacking,
  onNotificationStackingChange,
  notificationDurationMs,
  onNotificationDurationMsChange,
  notificationMaxVisible,
  onNotificationMaxVisibleChange,
  notificationClosable,
  onNotificationClosableChange,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  notificationHistoryQuery,
}: SettingsNotificationCenterPanelProps): JSX.Element {
  const { t } = useI18n();
  const [uncontrolledActiveTab, setUncontrolledActiveTab] =
    useState<NotificationCenterTabId>("preferences");
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;

  function handleTabChange(value: string): void {
    if (
      value !== "preferences" &&
      value !== "appearance" &&
      value !== "history"
    ) {
      return;
    }
    if (onActiveTabChange !== undefined) {
      onActiveTabChange(value);
      return;
    }
    setUncontrolledActiveTab(value);
  }

  return (
    <div
      className={styles.root}
      data-testid="settings-notification-center"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList
          className={styles.tabs}
          indicator="slide"
          data-testid="settings-notification-center-tabs"
          aria-label={t("settings.notifications.center.tabsAria")}
        >
          <TabsTrigger
            value="preferences"
            data-testid="settings-notification-center-tab-preferences"
          >
            {t("settings.notifications.tab.preferences")}
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            data-testid="settings-notification-center-tab-appearance"
          >
            {t("settings.notifications.tab.appearance")}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            data-testid="settings-notification-center-tab-history"
          >
            {t("settings.notifications.tab.history")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "preferences" ? (
        <SettingsNotificationPreferencesPanel
          preferences={preferences}
          onMasterInAppPopupEnabledChange={onMasterInAppPopupEnabledChange}
          onModuleEnabledChange={onModuleEnabledChange}
          onModuleMinLevelChange={onModuleMinLevelChange}
          onModuleRaiseWindowChange={onModuleRaiseWindowChange}
          onApplyPreset={onApplyPreset}
        />
      ) : null}

      {activeTab === "appearance" ? (
        <SettingsNotificationAppearancePanel
          notificationPlacement={notificationPlacement}
          onNotificationPlacementChange={onNotificationPlacementChange}
          notificationStacking={notificationStacking}
          onNotificationStackingChange={onNotificationStackingChange}
          notificationDurationMs={notificationDurationMs}
          onNotificationDurationMsChange={onNotificationDurationMsChange}
          notificationMaxVisible={notificationMaxVisible}
          onNotificationMaxVisibleChange={onNotificationMaxVisibleChange}
          notificationClosable={notificationClosable}
          onNotificationClosableChange={onNotificationClosableChange}
        />
      ) : null}

      {activeTab === "history" ? (
        notificationHistoryQuery === undefined ? (
          <p data-testid="settings-notification-history-unavailable">
            {t("settings.notifications.unavailable")}
          </p>
        ) : (
          <SettingsNotificationHistoryPanel query={notificationHistoryQuery} />
        )
      ) : null}
    </div>
  );
}

import type { JSX, MouseEvent } from "react";

import type { SavedAccountProfileSelectorOption } from "@application/projections/settings/deriveSavedAccountProfileSelectorOptions.js";
import type { SavedAccountProfileId } from "@application/index.js";

import { useI18n } from "../../i18n/index.js";
import { IconControlButton } from "../icons/index.js";
import { Tabs, TabsList, TabsTrigger } from "../ui/index.js";
import styles from "./SavedAccountProfileSelector.module.css";

const NEW_PROFILE_TAB_VALUE = "new";

export type SavedAccountProfileSelectorProps = Readonly<{
  options: ReadonlyArray<SavedAccountProfileSelectorOption>;
  selectedProfileId: SavedAccountProfileId | null;
  disabled?: boolean;
  onSelect: (profileId: SavedAccountProfileId | null) => void;
  onDeleteRequest: (profileId: SavedAccountProfileId) => void;
}>;

/**
 * - Purpose: render saved SIP profile tab navigation with per-tab delete icon.
 * - Inputs: tab options, selection, disabled flag, and callbacks.
 * - Outputs: accessible tablist without facade or business rules.
 */
export function SavedAccountProfileSelector({
  options,
  selectedProfileId,
  disabled = false,
  onSelect,
  onDeleteRequest,
}: SavedAccountProfileSelectorProps): JSX.Element {
  const { t } = useI18n();
  const activeTabValue = selectedProfileId ?? NEW_PROFILE_TAB_VALUE;
  const deleteLabel = t("account.profile.delete");

  function handleTabValueChange(nextValue: string): void {
    onSelect(nextValue === NEW_PROFILE_TAB_VALUE ? null : (nextValue as SavedAccountProfileId));
  }

  function handleDeleteClick(
    event: MouseEvent<HTMLButtonElement>,
    profileId: SavedAccountProfileId,
  ): void {
    event.stopPropagation();
    if (disabled) {
      return;
    }

    onDeleteRequest(profileId);
  }

  return (
    <div className={styles.row} data-testid="saved-account-profile-selector">
      <Tabs
        value={activeTabValue}
        onValueChange={handleTabValueChange}
        className={styles.tabsRoot}
      >
        <TabsList
          aria-label={t("account.profile.tabs.ariaLabel")}
          className={styles.tablist}
          data-testid="saved-account-profile-tablist"
        >
          <div className={styles.profileTabShell} data-testid="saved-account-profile-tab-new-group">
            <TabsTrigger
              value={NEW_PROFILE_TAB_VALUE}
              id="saved-profile-tab-new"
              disabled={disabled}
              className={styles.profileTabTrigger}
              data-testid="saved-account-profile-tab-new"
            >
              {t("account.profile.option.new")}
            </TabsTrigger>
          </div>
          {options.map((option) => (
            <div
              key={option.id}
              className={styles.profileTabShell}
              data-testid="saved-account-profile-tab-group"
              data-profile-id={option.id}
            >
              <TabsTrigger
                value={option.id}
                id={`saved-profile-tab-${option.id}`}
                disabled={disabled}
                className={styles.profileTabTrigger}
                data-testid="saved-account-profile-tab"
                data-profile-id={option.id}
              >
                <span className={styles.tabLabel}>{option.label}</span>
              </TabsTrigger>
              <IconControlButton
                iconId="account.profile.delete"
                preferAnimated={false}
                ariaLabel={deleteLabel}
                tooltipLabel={deleteLabel}
                disabled={disabled}
                testId="saved-account-profile-tab-delete"
                className={styles.tabDelete}
                onClick={(event) => {
                  handleDeleteClick(event, option.id);
                }}
              />
            </div>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

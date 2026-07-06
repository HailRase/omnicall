import type { JSX } from "react";

import type { SavedAccountProfileSelectorOption } from "@application/projections/deriveSavedAccountProfileSelectorOptions.js";
import type { SavedAccountProfileId } from "@application/index.js";

import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import { Tabs, TabsList, TabsTrigger } from "../ui/index.js";
import styles from "./SavedAccountProfileSelector.module.css";

const NEW_PROFILE_TAB_VALUE = "new";

export type SavedAccountProfileSelectorProps = Readonly<{
  options: ReadonlyArray<SavedAccountProfileSelectorOption>;
  selectedProfileId: SavedAccountProfileId | null;
  disabled?: boolean;
  onSelect: (profileId: SavedAccountProfileId | null) => void;
  onDeleteRequest: () => void;
}>;

/**
 * - Purpose: render saved SIP profile tab navigation with New entry and delete action.
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
  const canDelete = selectedProfileId !== null && !disabled;
  const activeTabValue = selectedProfileId ?? NEW_PROFILE_TAB_VALUE;

  function handleTabValueChange(nextValue: string): void {
    onSelect(nextValue === NEW_PROFILE_TAB_VALUE ? null : (nextValue as SavedAccountProfileId));
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
          <TabsTrigger
            value={NEW_PROFILE_TAB_VALUE}
            id="saved-profile-tab-new"
            disabled={disabled}
            data-testid="saved-account-profile-tab-new"
          >
            {t("account.profile.option.new")}
          </TabsTrigger>
          {options.map((option) => (
            <TabsTrigger
              key={option.id}
              value={option.id}
              id={`saved-profile-tab-${option.id}`}
              disabled={disabled}
              className={styles.profileTab}
              data-testid="saved-account-profile-tab"
              data-profile-id={option.id}
            >
              <span className={styles.tabLabel}>{option.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <button
        type="button"
        className={styles.deleteButton}
        disabled={!canDelete}
        aria-label={t("account.profile.delete")}
        data-testid="saved-account-profile-delete"
        onClick={onDeleteRequest}
      >
        <AppIcon id="dial.delete" size={16} decorative />
        <span className={styles.deleteButtonLabel}>{t("account.profile.delete")}</span>
      </button>
    </div>
  );
}

import { useCallback, useRef, type JSX, type KeyboardEvent } from "react";

import clsx from "clsx";

import type { SavedAccountProfileSelectorOption } from "@application/projections/deriveSavedAccountProfileSelectorOptions.js";

import type { SavedAccountProfileId } from "@application/index.js";

import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import styles from "./SavedAccountProfileSelector.module.css";



export type SavedAccountProfileSelectorProps = Readonly<{

  options: ReadonlyArray<SavedAccountProfileSelectorOption>;

  selectedProfileId: SavedAccountProfileId | null;

  disabled?: boolean;

  onSelect: (profileId: SavedAccountProfileId | null) => void;

  onDeleteRequest: () => void;

}>;



type TabTarget =

  | Readonly<{ kind: "new" }>

  | Readonly<{ kind: "saved"; profileId: SavedAccountProfileId }>;



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

  const tabRefs = useRef<ReadonlyArray<HTMLButtonElement | null>>([]);

  const canDelete = selectedProfileId !== null && !disabled;



  const tabTargets: ReadonlyArray<TabTarget> = [

    { kind: "new" },

    ...options.map((option) => ({ kind: "saved" as const, profileId: option.id })),

  ];



  const selectedTabIndex = tabTargets.findIndex((target) =>

    target.kind === "new"

      ? selectedProfileId === null

      : selectedProfileId === target.profileId,

  );



  const focusTabAt = useCallback((index: number): void => {

    const tab = tabRefs.current[index];

    tab?.focus();

  }, []);



  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {

    if (event.key === "ArrowRight") {

      event.preventDefault();

      const nextIndex = (index + 1) % tabTargets.length;

      focusTabAt(nextIndex);

      return;

    }



    if (event.key === "ArrowLeft") {

      event.preventDefault();

      const nextIndex = (index - 1 + tabTargets.length) % tabTargets.length;

      focusTabAt(nextIndex);

      return;

    }



    if (event.key === "Home") {

      event.preventDefault();

      focusTabAt(0);

      return;

    }



    if (event.key === "End") {

      event.preventDefault();

      focusTabAt(tabTargets.length - 1);

    }

  }



  return (

    <div className={styles.row} data-testid="saved-account-profile-selector">

      <div

        className={styles.tablistWrap}

        role="tablist"

        aria-label={t("account.profile.tabs.ariaLabel")}

        data-testid="saved-account-profile-tablist"

      >

        {tabTargets.map((target, index) => {

          const isSelected = index === selectedTabIndex;

          const isNew = target.kind === "new";

          const tabId = isNew ? "saved-profile-tab-new" : `saved-profile-tab-${target.profileId}`;

          const label = isNew

            ? t("account.profile.option.new")

            : (options.find((option) => option.id === target.profileId)?.label ?? "");



          return (

            <button

              key={tabId}

              ref={(element) => {

                const next = [...tabRefs.current];

                next[index] = element;

                tabRefs.current = next;

              }}

              type="button"

              role="tab"

              id={tabId}

              className={clsx(styles.tab, isSelected && styles.tabSelected)}

              aria-selected={isSelected}

              tabIndex={isSelected ? 0 : -1}

              disabled={disabled}

              data-testid={isNew ? "saved-account-profile-tab-new" : "saved-account-profile-tab"}

              data-profile-id={isNew ? undefined : target.profileId}

              onClick={() => {

                onSelect(isNew ? null : target.profileId);

              }}

              onKeyDown={(event) => {

                handleTabKeyDown(event, index);

              }}

            >

              <span className={styles.tabLabel}>{label}</span>

            </button>

          );

        })}

      </div>

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


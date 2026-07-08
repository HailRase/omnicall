import type { JSX, RefObject } from "react";
import type { SavedAccountProfileId } from "@application/index.js";
import type { SavedAccountProfileSelectorOption } from "@application/projections/settings/deriveSavedAccountProfileSelectorOptions.js";
import type { SavedProfilePanelMode } from "@application/projections/settings/deriveSavedProfilePanelMode.js";
import type { AccountAuthorizationErrorProjection } from "@application/projections/settings/mapAccountAuthorizationError.js";
import type { SipAccountInput } from "@application/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import { AccountPanel } from "../../account/AccountPanel.js";
import { DeleteSavedAccountProfileConfirmationModal } from "../../account/DeleteSavedAccountProfileConfirmationModal.js";
import { SwitchSavedAccountProfileConfirmationModal } from "../../account/SwitchSavedAccountProfileConfirmationModal.js";
import { SavedAccountProfileSelector } from "../../account/SavedAccountProfileSelector.js";
import styles from "./SettingsAccountPanel.module.css";

export type SettingsAccountPanelProps = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  error: AccountAuthorizationErrorProjection | null;
  successKey: TranslationKey | null;
  warningKey: TranslationKey | null;
  panelMode: SavedProfilePanelMode;
  disabled?: boolean;
  authorizeDisabledReason: string | null;
  logoutDisabledReason: string | null;
  savedProfileOptions: ReadonlyArray<SavedAccountProfileSelectorOption>;
  selectedProfileId: SavedAccountProfileId | null;
  saveProfileChecked: boolean;
  saveProfileDisabled: boolean;
  saveProfileDisabledReasonKey: TranslationKey | null;
  rememberPasswordChecked: boolean;
  passwordFieldVisible: boolean;
  rememberPasswordVisible: boolean;
  forgetRememberedPasswordVisible: boolean;
  rememberPasswordDisabled: boolean;
  rememberPasswordDisabledReasonKey: TranslationKey | null;
  passwordHintKey: TranslationKey | null;
  deleteConfirmationOpen: boolean;
  switchConfirmationOpen: boolean;
  switchFromLogin: string;
  switchToLogin: string;
  passwordInputRef: RefObject<HTMLInputElement | null>;
  onFieldChange: (field: keyof SipAccountInput, value: string) => void;
  onSubmit: () => void;
  onLogout: () => void;
  onProfileSelect: (profileId: SavedAccountProfileId | null) => void;
  onSaveProfileChange: (checked: boolean) => void;
  onRememberPasswordChange: (checked: boolean) => void;
  onForgetRememberedPassword: () => void;
  onDeleteProfileRequest: (profileId: SavedAccountProfileId) => void;
  onDeleteProfileConfirm: () => void;
  onDeleteProfileCancel: () => void;
  onSwitchProfileConfirm: () => void;
  onSwitchProfileCancel: () => void;
}>;

/**
 * - Purpose: embed saved profile tabs and SIP account authorization form in settings.
 * - Inputs: account form state, saved profile tab state, and field callbacks.
 * - Outputs: presentational account settings section without Use Case calls.
 */
export function SettingsAccountPanel({
  form,
  submitting,
  error,
  successKey,
  warningKey,
  panelMode,
  disabled = false,
  authorizeDisabledReason,
  logoutDisabledReason,
  savedProfileOptions,
  selectedProfileId,
  saveProfileChecked,
  saveProfileDisabled,
  saveProfileDisabledReasonKey,
  rememberPasswordChecked,
  passwordFieldVisible,
  rememberPasswordVisible,
  forgetRememberedPasswordVisible,
  rememberPasswordDisabled,
  rememberPasswordDisabledReasonKey,
  passwordHintKey,
  deleteConfirmationOpen,
  switchConfirmationOpen,
  switchFromLogin,
  switchToLogin,
  passwordInputRef,
  onFieldChange,
  onSubmit,
  onLogout,
  onProfileSelect,
  onSaveProfileChange,
  onRememberPasswordChange,
  onForgetRememberedPassword,
  onDeleteProfileRequest,
  onDeleteProfileConfirm,
  onDeleteProfileCancel,
  onSwitchProfileConfirm,
  onSwitchProfileCancel,
}: SettingsAccountPanelProps): JSX.Element {
  return (
    <div className={styles.wrapper} data-testid="settings-account-panel">
      <div className={styles.tabsRow}>
        <SavedAccountProfileSelector
          options={savedProfileOptions}
          selectedProfileId={selectedProfileId}
          disabled={disabled || submitting}
          onSelect={onProfileSelect}
          onDeleteRequest={onDeleteProfileRequest}
        />
      </div>

      <div className={styles.formCenter}>
        <AccountPanel
          form={form}
          submitting={submitting}
          error={error}
          successKey={successKey}
          warningKey={warningKey}
          panelMode={panelMode}
          disabled={disabled}
          authorizeDisabledReason={authorizeDisabledReason}
          logoutDisabledReason={logoutDisabledReason}
          passwordHintKey={passwordHintKey}
          passwordFieldVisible={passwordFieldVisible}
          saveProfileVisible={panelMode === "newFull"}
          saveProfileChecked={saveProfileChecked}
          saveProfileDisabled={saveProfileDisabled}
          saveProfileDisabledReasonKey={saveProfileDisabledReasonKey}
          rememberPasswordVisible={rememberPasswordVisible}
          forgetRememberedPasswordVisible={forgetRememberedPasswordVisible}
          rememberPasswordChecked={rememberPasswordChecked}
          rememberPasswordDisabled={rememberPasswordDisabled}
          rememberPasswordDisabledReasonKey={rememberPasswordDisabledReasonKey}
          passwordInputRef={passwordInputRef}
          onFieldChange={onFieldChange}
          onSaveProfileChange={onSaveProfileChange}
          onRememberPasswordChange={onRememberPasswordChange}
          onForgetRememberedPassword={onForgetRememberedPassword}
          onSubmit={onSubmit}
          onLogout={onLogout}
          showTitle={false}
        />
      </div>

      <DeleteSavedAccountProfileConfirmationModal
        open={deleteConfirmationOpen}
        onConfirm={onDeleteProfileConfirm}
        onCancel={onDeleteProfileCancel}
      />

      {switchConfirmationOpen ? (
        <div className={styles.modalBackdrop} data-testid="account-settings-modal-backdrop">
          <SwitchSavedAccountProfileConfirmationModal
            open={switchConfirmationOpen}
            fromLogin={switchFromLogin}
            toLogin={switchToLogin}
            onConfirm={onSwitchProfileConfirm}
            onCancel={onSwitchProfileCancel}
          />
        </div>
      ) : null}
    </div>
  );
}

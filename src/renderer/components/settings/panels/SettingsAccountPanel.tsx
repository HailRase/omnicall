import type { JSX, RefObject } from "react";
import type { SavedAccountProfileId } from "@application/index.js";
import type { SavedAccountProfileSelectorOption } from "@application/projections/settings/deriveSavedAccountProfileSelectorOptions.js";
import type { SavedProfilePanelMode } from "@application/projections/settings/deriveSavedProfilePanelMode.js";
import type { AccountAuthorizationErrorProjection } from "@application/projections/settings/mapAccountAuthorizationError.js";
import type { OcpRecoveryAction, SipAccountInput } from "@application/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import type { AccountUiSignInMode, OcpDraftFields } from "../../../hooks/accountActionsHelpers.js";
import { AccountPanel } from "../../account/AccountPanel.js";
import { DeleteSavedAccountProfileConfirmationModal } from "../../account/DeleteSavedAccountProfileConfirmationModal.js";
import { DiscardAccountDraftConfirmationModal } from "../../account/DiscardAccountDraftConfirmationModal.js";
import { OverwriteSavedAccountCredentialsConfirmationModal } from "../../account/OverwriteSavedAccountCredentialsConfirmationModal.js";
import { SavedAccountProfileSelector } from "../../account/SavedAccountProfileSelector.js";
import styles from "./SettingsAccountPanel.module.css";

export type SettingsAccountPanelProps = Readonly<{
  form: SipAccountInput;
  ocpDraft: OcpDraftFields;
  signInMode: AccountUiSignInMode;
  submitting: boolean;
  error: AccountAuthorizationErrorProjection | null;
  successKey: TranslationKey | null;
  warningKey: TranslationKey | null;
  panelMode: SavedProfilePanelMode;
  disabled?: boolean;
  authorizeDisabledReason: string | null;
  savedProfileOptions: ReadonlyArray<SavedAccountProfileSelectorOption>;
  selectedProfileId: SavedAccountProfileId | null;
  saveProfileChecked: boolean;
  saveProfileDisabled: boolean;
  saveProfileDisabledReasonKey: TranslationKey | null;
  rememberPasswordChecked: boolean;
  passwordFieldVisible: boolean;
  rememberPasswordVisible: boolean;
  rememberPasswordDisabled: boolean;
  passwordHintKey: TranslationKey | null;
  showOcpDomainField: boolean;
  showOcpApiKeyField: boolean;
  hasSavedOcpApiKey: boolean;
  allowedRecoveryActions: ReadonlyArray<OcpRecoveryAction>;
  onRecoveryAction: (action: OcpRecoveryAction) => void;
  canForgetSavedSipPassword?: boolean;
  onForgetSavedSipPassword?: () => void;
  deleteConfirmationOpen: boolean;
  deleteSubmitting?: boolean;
  passwordInputRef: RefObject<HTMLInputElement | null>;
  onFieldChange: (field: keyof SipAccountInput, value: string) => void;
  onOcpFieldChange: (field: keyof OcpDraftFields, value: string) => void;
  onSignInModeChange: (mode: AccountUiSignInMode) => void;
  onSubmit: () => void;
  onProfileSelect: (profileId: SavedAccountProfileId | null) => void;
  onSaveProfileChange: (checked: boolean) => void;
  onRememberPasswordChange: (checked: boolean) => void;
  onDeleteProfileRequest: (profileId: SavedAccountProfileId) => void;
  onDeleteProfileConfirm: () => void;
  onDeleteProfileCancel: () => void;
  overwriteConfirmationOpen?: boolean;
  draftDiscardConfirmationOpen?: boolean;
  onDraftDiscardConfirm?: () => void;
  onDraftDiscardCancel?: () => void;
  onOverwriteCredentialsConfirm?: () => void;
  onOverwriteCredentialsContinue?: () => void;
  onOverwriteCredentialsCancel?: () => void;
}>;

/**
 * - Purpose: embed saved profile tabs and SIP/OCP account sign-in form in settings (WU-04).
 * - Inputs: account form state, mode, OCP draft, recovery actions, field callbacks.
 * - Outputs: presentational account settings section without Use Case calls.
 */
export function SettingsAccountPanel({
  form,
  ocpDraft,
  signInMode,
  submitting,
  error,
  successKey,
  warningKey,
  panelMode,
  disabled = false,
  authorizeDisabledReason,
  savedProfileOptions,
  selectedProfileId,
  saveProfileChecked,
  saveProfileDisabled,
  saveProfileDisabledReasonKey,
  rememberPasswordChecked,
  passwordFieldVisible,
  rememberPasswordVisible,
  rememberPasswordDisabled,
  passwordHintKey,
  showOcpDomainField,
  showOcpApiKeyField,
  hasSavedOcpApiKey,
  allowedRecoveryActions,
  onRecoveryAction,
  canForgetSavedSipPassword = false,
  onForgetSavedSipPassword,
  deleteConfirmationOpen,
  deleteSubmitting = false,
  passwordInputRef,
  onFieldChange,
  onOcpFieldChange,
  onSignInModeChange,
  onSubmit,
  onProfileSelect,
  onSaveProfileChange,
  onRememberPasswordChange,
  onDeleteProfileRequest,
  onDeleteProfileConfirm,
  onDeleteProfileCancel,
  overwriteConfirmationOpen = false,
  draftDiscardConfirmationOpen = false,
  onDraftDiscardConfirm = () => undefined,
  onDraftDiscardCancel = () => undefined,
  onOverwriteCredentialsConfirm = () => undefined,
  onOverwriteCredentialsContinue = () => undefined,
  onOverwriteCredentialsCancel = () => undefined,
}: SettingsAccountPanelProps): JSX.Element {
  const saveProfileVisible = selectedProfileId === null;
  const sharedRememberPasswordVisible =
    selectedProfileId === null && rememberPasswordVisible;

  return (
    <div
      className={styles.wrapper}
      data-testid="settings-account-panel"
    >
      <div className={styles.tabsRow}>
        <SavedAccountProfileSelector
          options={savedProfileOptions}
          selectedProfileId={selectedProfileId}
          disabled={disabled || submitting}
          onSelect={onProfileSelect}
          onDeleteRequest={onDeleteProfileRequest}
        />
      </div>

      <div
        className={styles.formCenter}
      >
        <AccountPanel
          form={form}
          ocpDraft={ocpDraft}
          signInMode={signInMode}
          submitting={submitting}
          error={error}
          successKey={successKey}
          warningKey={warningKey}
          panelMode={panelMode}
          disabled={disabled}
          authorizeDisabledReason={authorizeDisabledReason}
          passwordHintKey={passwordHintKey}
          passwordFieldVisible={passwordFieldVisible}
          saveProfileVisible={saveProfileVisible}
          saveProfileChecked={saveProfileChecked}
          saveProfileDisabled={saveProfileDisabled}
          saveProfileDisabledReasonKey={saveProfileDisabledReasonKey}
          rememberPasswordVisible={sharedRememberPasswordVisible}
          rememberPasswordChecked={rememberPasswordChecked}
          rememberPasswordDisabled={rememberPasswordDisabled}
          showOcpDomainField={showOcpDomainField}
          showOcpApiKeyField={showOcpApiKeyField}
          showOcpLoginField={selectedProfileId === null}
          hasSavedOcpApiKey={hasSavedOcpApiKey}
          allowedRecoveryActions={allowedRecoveryActions}
          onRecoveryAction={onRecoveryAction}
          canForgetSavedSipPassword={canForgetSavedSipPassword}
          {...(onForgetSavedSipPassword !== undefined
            ? { onForgetSavedSipPassword }
            : {})}
          passwordInputRef={passwordInputRef}
          onFieldChange={onFieldChange}
          onOcpFieldChange={onOcpFieldChange}
          onSignInModeChange={onSignInModeChange}
          onSaveProfileChange={onSaveProfileChange}
          onRememberPasswordChange={onRememberPasswordChange}
          onSubmit={onSubmit}
          showTitle={false}
        />
      </div>

      <DeleteSavedAccountProfileConfirmationModal
        open={deleteConfirmationOpen}
        loading={deleteSubmitting}
        onConfirm={onDeleteProfileConfirm}
        onCancel={onDeleteProfileCancel}
      />
      <OverwriteSavedAccountCredentialsConfirmationModal
        open={overwriteConfirmationOpen}
        loading={submitting}
        onConfirm={onOverwriteCredentialsConfirm}
        onContinueWithoutOverwrite={onOverwriteCredentialsContinue}
        onCancel={onOverwriteCredentialsCancel}
      />
      <DiscardAccountDraftConfirmationModal
        open={draftDiscardConfirmationOpen}
        onConfirm={onDraftDiscardConfirm}
        onCancel={onDraftDiscardCancel}
      />
    </div>
  );
}

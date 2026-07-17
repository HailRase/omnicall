import { createRef } from "react";
import { vi } from "vitest";
import { createSettingsAccountKey } from "@application/index.js";
import type { SavedAccountProfileSelectorOption } from "@application/projections/settings/deriveSavedAccountProfileSelectorOptions.js";

const savedProfileOptions: ReadonlyArray<SavedAccountProfileSelectorOption> = [
  {
    id: createSettingsAccountKey("user@example.com"),
    label: "user",
  },
];

export const settingsAccountTestDefaults = {
  form: { username: "user", password: "", domain: "example.com", server: "sip.example.com" },
  ocpDraft: { login: "user", domain: "", apiKey: "" },
  signInMode: "sip_only" as const,
  submitting: false,
  error: null,
  successKey: null,
  warningKey: null,
  panelMode: "newFull" as const,
  disabled: false,
  authorizeDisabledReason: null,
  savedProfileOptions,
  selectedProfileId: null,
  saveProfileChecked: false,
  saveProfileDisabled: false,
  saveProfileDisabledReasonKey: null,
  rememberPasswordChecked: false,
  passwordFieldVisible: true,
  rememberPasswordVisible: false,
  forgetRememberedPasswordVisible: false,
  rememberPasswordDisabled: true,
  passwordHintKey: null,
  showOcpDomainField: true,
  showOcpApiKeyField: true,
  hasSavedOcpApiKey: false,
  allowedRecoveryActions: [],
  onRecoveryAction: vi.fn(),
  deleteConfirmationOpen: false,
  passwordInputRef: createRef<HTMLInputElement>(),
  onFieldChange: vi.fn(),
  onOcpFieldChange: vi.fn(),
  onSignInModeChange: vi.fn(),
  onSubmit: vi.fn(),
  onProfileSelect: vi.fn(),
  onSaveProfileChange: vi.fn(),
  onRememberPasswordChange: vi.fn(),
  onForgetRememberedPassword: vi.fn(),
  onDeleteProfileRequest: vi.fn(),
  onDeleteProfileConfirm: vi.fn(),
  onDeleteProfileCancel: vi.fn(),
} as const;

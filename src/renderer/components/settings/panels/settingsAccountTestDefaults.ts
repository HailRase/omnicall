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
  submitting: false,
  error: null,
  successKey: null,
  warningKey: null,
  panelMode: "newFull" as const,
  disabled: false,
  authorizeDisabledReason: null,
  logoutDisabledReason: null,
  savedProfileOptions,
  selectedProfileId: null,
  saveProfileChecked: false,
  saveProfileDisabled: false,
  saveProfileDisabledReasonKey: null,
  passwordHintKey: null,
  deleteConfirmationOpen: false,
  switchConfirmationOpen: false,
  switchFromLogin: "",
  switchToLogin: "",
  passwordInputRef: createRef<HTMLInputElement>(),
  onFieldChange: vi.fn(),
  onSubmit: vi.fn(),
  onLogout: vi.fn(),
  onProfileSelect: vi.fn(),
  onSaveProfileChange: vi.fn(),
  onDeleteProfileRequest: vi.fn(),
  onDeleteProfileConfirm: vi.fn(),
  onDeleteProfileCancel: vi.fn(),
  onSwitchProfileConfirm: vi.fn(),
  onSwitchProfileCancel: vi.fn(),
} as const;

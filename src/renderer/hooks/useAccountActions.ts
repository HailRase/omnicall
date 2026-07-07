import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type {
  AccountBootstrapFacade,
  AuthorizeAccountOutcome,
} from "@application/facades/AccountBootstrapFacade.js";
import { deriveSavedAccountProfileSelectorOptions } from "@application/projections/deriveSavedAccountProfileSelectorOptions.js";
import type { SavedAccountProfileSelectorOption } from "@application/projections/deriveSavedAccountProfileSelectorOptions.js";
import {
  deriveSavedProfilePanelMode,
  type SavedProfilePanelMode,
} from "@application/projections/deriveSavedProfilePanelMode.js";
import { formatAccountSwitchLoginLabel } from "@application/projections/formatAccountSwitchLoginLabel.js";
import { resolveAccountAuthorizeTargetIdentity } from "@application/projections/resolveAccountAuthorizeTargetIdentity.js";
import {
  mapAccountAuthorizationError,
  type AccountAuthorizationErrorProjection,
} from "@application/projections/mapAccountAuthorizationError.js";
import type { SipAccountInput, SavedAccountProfile, SavedAccountProfileId } from "@application/index.js";
import {
  findSavedAccountProfileByInput,
  matchesSipAccountIdentity,
  type SettingsAccountIdentity,
} from "@application/projections/savedProfileIdentity.js";
import { isErr } from "@shared/result/index.js";
import { readSipEnvDefaults } from "../bootstrap/readSipEnvDefaults.js";
import type { TranslationKey } from "../i18n/messages.js";

const EMPTY_FORM: SipAccountInput = {
  username: "",
  password: "",
  domain: "",
  server: "",
};

const ACCOUNT_SUCCESS_KEY = "account.success.authorizationSucceeded" as const;
const ACCOUNT_ERROR_UNKNOWN_KEY = "account.error.authorizationFailed" as const;
const PROFILE_SAVE_WARNING_KEY = "account.warning.profileSaveFailed" as const;
const PROFILE_TOUCH_WARNING_KEY = "account.warning.profileTouchFailed" as const;
const FEEDBACK_CLEAR_MS = 3200;
const NEW_PROFILE_SELECTION = null;

function buildInitialForm(): SipAccountInput {
  return {
    ...EMPTY_FORM,
    ...readSipEnvDefaults(),
  };
}

function resolveMetadataWarningKey(
  outcome: AuthorizeAccountOutcome,
): TranslationKey | null {
  if (outcome.metadataWarning === "profile_save_failed") {
    return PROFILE_SAVE_WARNING_KEY;
  }
  if (outcome.metadataWarning === "profile_touch_failed") {
    return PROFILE_TOUCH_WARNING_KEY;
  }
  return null;
}

function resolveSubmitTargetIdentity(
  form: SipAccountInput,
  selectedProfile: SavedAccountProfile | null,
): SettingsAccountIdentity | null {
  return resolveAccountAuthorizeTargetIdentity(form, selectedProfile);
}

type UseAccountActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  isSipRegistered?: boolean;
  registeredIdentity?: SettingsAccountIdentity | null;
}>;

type UseAccountActionsResult = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  error: AccountAuthorizationErrorProjection | null;
  successKey: TranslationKey | null;
  warningKey: TranslationKey | null;
  panelMode: SavedProfilePanelMode;
  savedProfileOptions: ReadonlyArray<SavedAccountProfileSelectorOption>;
  selectedProfileId: SavedAccountProfileId | null;
  saveProfileChecked: boolean;
  saveProfileDisabled: boolean;
  saveProfileDisabledReasonKey: TranslationKey | null;
  passwordHintKey: TranslationKey | null;
  profileSwitchAllowed: boolean;
  deleteConfirmationOpen: boolean;
  switchConfirmationOpen: boolean;
  switchFromLogin: string;
  switchToLogin: string;
  passwordInputRef: RefObject<HTMLInputElement | null>;
  updateField: (field: keyof SipAccountInput, value: string) => void;
  handleSubmit: () => void;
  selectProfile: (profileId: SavedAccountProfileId | null) => void;
  setSaveProfileChecked: (checked: boolean) => void;
  requestDeleteSelectedProfile: (profileId: SavedAccountProfileId) => void;
  confirmDeleteSelectedProfile: () => void;
  cancelDeleteSelectedProfile: () => void;
  confirmSwitchProfile: () => void;
  cancelSwitchProfile: () => void;
  reloadSavedProfiles: () => void;
}>;

/**
 * - Purpose: bind SIP account form UI to saved-profile and manual authorize facade methods.
 * - Inputs: account bootstrap facade, SIP registration flag, and registered identity projection.
 * - Outputs: form state, saved profile tab state, submit handlers, and confirmation modal flags.
 */
export function useAccountActions(input: UseAccountActionsInput): UseAccountActionsResult {
  const {
    facade,
    isSipRegistered = false,
    registeredIdentity = null,
  } = input;
  const [form, setForm] = useState<SipAccountInput>(buildInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AccountAuthorizationErrorProjection | null>(null);
  const [successKey, setSuccessKey] = useState<TranslationKey | null>(null);
  const [warningKey, setWarningKey] = useState<TranslationKey | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<ReadonlyArray<SavedAccountProfile>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<SavedAccountProfileId | null>(
    NEW_PROFILE_SELECTION,
  );
  const [saveProfileChecked, setSaveProfileChecked] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [switchConfirmationOpen, setSwitchConfirmationOpen] = useState(false);
  const [switchFromLogin, setSwitchFromLogin] = useState("");
  const [switchToLogin, setSwitchToLogin] = useState("");
  const [deleteTargetProfileId, setDeleteTargetProfileId] =
    useState<SavedAccountProfileId | null>(null);
  const feedbackClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const wasSipRegisteredRef = useRef(false);
  const suppressRegistrationEndResetRef = useRef(false);
  const savedProfilesByIdRef = useRef<ReadonlyMap<SavedAccountProfileId, SavedAccountProfile>>(
    new Map(),
  );

  const savedProfileOptions = deriveSavedAccountProfileSelectorOptions(savedProfiles);
  const selectedProfile =
    selectedProfileId === null
      ? null
      : (savedProfilesByIdRef.current.get(selectedProfileId) ?? null);

  const panelMode = deriveSavedProfilePanelMode({
    selectedProfileId,
    selectedProfile,
    isSipRegistered,
    registeredIdentity,
  });

  const duplicateSavedProfile = useMemo(
    () =>
      findSavedAccountProfileByInput(savedProfiles, {
        username: form.username,
        domain: form.domain,
        server: form.server,
      }),
    [form.domain, form.server, form.username, savedProfiles],
  );

  const saveProfileDisabled = duplicateSavedProfile !== null;
  const saveProfileDisabledReasonKey: TranslationKey | null = saveProfileDisabled
    ? "account.profile.saveCheckbox.duplicate"
    : null;

  const clearFeedbackTimer = useCallback((): void => {
    if (feedbackClearTimerRef.current !== null) {
      clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }
  }, []);

  const scheduleFeedbackClear = useCallback((): void => {
    clearFeedbackTimer();
    feedbackClearTimerRef.current = setTimeout(() => {
      setError(null);
      setSuccessKey(null);
      setWarningKey(null);
      feedbackClearTimerRef.current = null;
    }, FEEDBACK_CLEAR_MS);
  }, [clearFeedbackTimer]);

  useEffect(() => {
    return () => {
      clearFeedbackTimer();
    };
  }, [clearFeedbackTimer]);

  const clearFeedback = useCallback((): void => {
    setError(null);
    setSuccessKey(null);
    setWarningKey(null);
    clearFeedbackTimer();
  }, [clearFeedbackTimer]);

  const reloadSavedProfiles = useCallback((): void => {
    if (facade === null) {
      setSavedProfiles([]);
      savedProfilesByIdRef.current = new Map();
      return;
    }

    void facade.listSavedAccountProfiles().then((result) => {
      if (!result.ok) {
        return;
      }

      setSavedProfiles(result.value);
      savedProfilesByIdRef.current = new Map(
        result.value.map((profile) => [profile.id, profile] as const),
      );
    });
  }, [facade]);

  useEffect(() => {
    reloadSavedProfiles();
  }, [reloadSavedProfiles]);

  const resetToNewProfile = useCallback((): void => {
    setSelectedProfileId(NEW_PROFILE_SELECTION);
    setSaveProfileChecked(false);
    setForm(buildInitialForm());
    clearFeedback();
  }, [clearFeedback]);

  useEffect(() => {
    if (wasSipRegisteredRef.current && !isSipRegistered) {
      if (!suppressRegistrationEndResetRef.current) {
        resetToNewProfile();
      }
    }
    wasSipRegisteredRef.current = isSipRegistered;
  }, [isSipRegistered, resetToNewProfile]);

  const applySavedProfileSelection = useCallback((profileId: SavedAccountProfileId): void => {
    const profile = savedProfilesByIdRef.current.get(profileId);
    if (profile === undefined) {
      return;
    }

    const isRegisteredForProfile =
      isSipRegistered &&
      registeredIdentity !== null &&
      matchesSipAccountIdentity(profile, registeredIdentity);

    setSelectedProfileId(profileId);
    setSaveProfileChecked(false);
    setForm({
      username: profile.username,
      password: "",
      domain: profile.domain,
      server: profile.server,
    });
    clearFeedback();

    if (!isRegisteredForProfile) {
      queueMicrotask(() => {
        passwordInputRef.current?.focus();
      });
    }
  }, [clearFeedback, isSipRegistered, registeredIdentity]);

  const selectProfile = useCallback(
    (profileId: SavedAccountProfileId | null): void => {
      if (profileId === NEW_PROFILE_SELECTION) {
        resetToNewProfile();
        return;
      }

      applySavedProfileSelection(profileId);
    },
    [applySavedProfileSelection, resetToNewProfile],
  );

  const updateField = useCallback(
    (field: keyof SipAccountInput, value: string): void => {
      if (
        selectedProfileId !== null &&
        (field === "username" || field === "domain" || field === "server")
      ) {
        const profile = savedProfilesByIdRef.current.get(selectedProfileId);
        if (profile !== undefined && profile[field] !== value) {
          setSelectedProfileId(NEW_PROFILE_SELECTION);
          setSaveProfileChecked(false);
        }
      }

      setForm((current) => ({
        ...current,
        [field]: value,
      }));
      clearFeedback();
    },
    [clearFeedback, selectedProfileId],
  );

  const executeAuthorize = useCallback((): void => {
    if (facade === null || submitting) {
      return;
    }

    void (async (): Promise<void> => {
      setSubmitting(true);
      clearFeedback();

      try {
        const result =
          selectedProfileId === null
            ? await facade.authorizeManualAccount(form, {
                saveProfile: saveProfileChecked,
              })
            : await facade.authorizeSavedAccountProfile(selectedProfileId, form.password);

        if (isErr(result)) {
          setError(mapAccountAuthorizationError(result.error));
          scheduleFeedbackClear();
          return;
        }

        setSuccessKey(ACCOUNT_SUCCESS_KEY);
        setWarningKey(resolveMetadataWarningKey(result.value));
        scheduleFeedbackClear();
        reloadSavedProfiles();
      } catch {
        setError({ key: ACCOUNT_ERROR_UNKNOWN_KEY });
        scheduleFeedbackClear();
      } finally {
        suppressRegistrationEndResetRef.current = false;
        setSubmitting(false);
      }
    })();
  }, [
    facade,
    form,
    reloadSavedProfiles,
    saveProfileChecked,
    scheduleFeedbackClear,
    selectedProfileId,
    submitting,
    clearFeedback,
  ]);

  const handleSubmit = useCallback((): void => {
    if (facade === null || submitting) {
      return;
    }

    const targetIdentity = resolveSubmitTargetIdentity(form, selectedProfile);
    if (
      isSipRegistered &&
      registeredIdentity !== null &&
      targetIdentity !== null &&
      !matchesSipAccountIdentity(registeredIdentity, targetIdentity)
    ) {
      setSwitchFromLogin(formatAccountSwitchLoginLabel(registeredIdentity, savedProfiles));
      setSwitchToLogin(formatAccountSwitchLoginLabel(targetIdentity, savedProfiles));
      setSwitchConfirmationOpen(true);
      return;
    }

    executeAuthorize();
  }, [
    executeAuthorize,
    facade,
    form,
    isSipRegistered,
    registeredIdentity,
    savedProfiles,
    selectedProfile,
    submitting,
  ]);

  const confirmSwitchProfile = useCallback((): void => {
    setSwitchConfirmationOpen(false);
    suppressRegistrationEndResetRef.current = true;
    executeAuthorize();
  }, [executeAuthorize]);

  const cancelSwitchProfile = useCallback((): void => {
    setSwitchConfirmationOpen(false);
  }, []);

  const requestDeleteSelectedProfile = useCallback((profileId: SavedAccountProfileId): void => {
    setDeleteTargetProfileId(profileId);
    setDeleteConfirmationOpen(true);
  }, []);

  const cancelDeleteSelectedProfile = useCallback((): void => {
    setDeleteConfirmationOpen(false);
    setDeleteTargetProfileId(null);
  }, []);

  const confirmDeleteSelectedProfile = useCallback((): void => {
    if (facade === null || deleteTargetProfileId === null) {
      cancelDeleteSelectedProfile();
      return;
    }

    const profileId = deleteTargetProfileId;
    cancelDeleteSelectedProfile();

    void (async (): Promise<void> => {
      const result = await facade.deleteSavedAccountProfile(profileId);
      if (isErr(result)) {
        setError(mapAccountAuthorizationError(result.error));
        scheduleFeedbackClear();
        return;
      }

      if (selectedProfileId === profileId) {
        resetToNewProfile();
      }

      reloadSavedProfiles();
    })();
  }, [
    cancelDeleteSelectedProfile,
    deleteTargetProfileId,
    facade,
    reloadSavedProfiles,
    resetToNewProfile,
    scheduleFeedbackClear,
    selectedProfileId,
  ]);

  const passwordHintKey: TranslationKey | null =
    panelMode === "savedPasswordOnly" ? "account.profile.passwordHint.savedProfile" : null;

  const authorizeTargetIdentity = useMemo(
    () => resolveAccountAuthorizeTargetIdentity(form, selectedProfile),
    [form, selectedProfile],
  );

  const profileSwitchAllowed = useMemo(
    () =>
      isSipRegistered &&
      registeredIdentity !== null &&
      authorizeTargetIdentity !== null &&
      !matchesSipAccountIdentity(registeredIdentity, authorizeTargetIdentity),
    [authorizeTargetIdentity, isSipRegistered, registeredIdentity],
  );

  useEffect(() => {
    if (saveProfileDisabled && saveProfileChecked) {
      setSaveProfileChecked(false);
    }
  }, [saveProfileChecked, saveProfileDisabled]);

  return {
    form,
    submitting,
    error,
    successKey,
    warningKey,
    panelMode,
    savedProfileOptions,
    selectedProfileId,
    saveProfileChecked,
    saveProfileDisabled,
    saveProfileDisabledReasonKey,
    passwordHintKey,
    profileSwitchAllowed,
    deleteConfirmationOpen,
    switchConfirmationOpen,
    switchFromLogin,
    switchToLogin,
    passwordInputRef,
    updateField,
    handleSubmit,
    selectProfile,
    setSaveProfileChecked,
    requestDeleteSelectedProfile,
    confirmDeleteSelectedProfile,
    cancelDeleteSelectedProfile,
    confirmSwitchProfile,
    cancelSwitchProfile,
    reloadSavedProfiles,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { AccountSignInViewModel } from "@application/projections/settings/accountSignInViewModel.js";
import { initialAuthorizationProgressProjection } from "@application/projections/settings/authorizationProgressProjection.js";
import {
  isColdIdleAuthorizationProgress,
  shouldOpenOcpSignInProgressModal,
} from "@application/projections/settings/shouldOpenOcpSignInProgressModal.js";
import { deriveSavedAccountProfileSelectorOptions } from "@application/projections/settings/deriveSavedAccountProfileSelectorOptions.js";
import type { SavedAccountProfileSelectorOption } from "@application/projections/settings/deriveSavedAccountProfileSelectorOptions.js";
import {
  deriveSavedProfilePanelMode,
  type SavedProfilePanelMode,
} from "@application/projections/settings/deriveSavedProfilePanelMode.js";
import {
  mapAccountAuthorizationError,
  type AccountAuthorizationErrorProjection,
} from "@application/projections/settings/mapAccountAuthorizationError.js";
import type {
  OcpRecoveryAction,
  SipAccountInput,
  SavedAccountProfile,
  SavedAccountProfileId,
} from "@application/index.js";
import {
  findSavedAccountProfileByInput,
  type SettingsAccountIdentity,
} from "@application/projections/settings/savedProfileIdentity.js";
import { isErr } from "@shared/result/index.js";
import { readSipEnvDefaults } from "../bootstrap/readSipEnvDefaults.js";
import type { TranslationKey } from "../i18n/messages.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import {
  assignAccountSignInErrorChannels,
  deriveAccountSignInNotificationFeedback,
} from "@application/projections/settings/deriveAccountSignInNotificationFeedback.js";
import {
  buildAccountSignInCommand,
  deriveOcpConfigFieldVisibility,
  resolveMetadataWarningKey,
  type AccountUiSignInMode,
  type OcpDraftFields,
} from "./accountActionsHelpers.js";

function ocpProgressOwnsSignInFailure(
  progress: AccountSignInViewModel["authorizationProgress"],
): boolean {
  return shouldOpenOcpSignInProgressModal(progress);
}

const EMPTY_FORM: SipAccountInput = {
  username: "",
  password: "",
  domain: "",
  server: "",
};

const EMPTY_OCP: OcpDraftFields = {
  login: "",
  domain: "",
  apiKey: "",
};

const SIP_READY_SUCCESS_KEYS = [
  "account.success.sipTransportConnected",
  "account.success.sipRegistrationSucceeded",
] as const satisfies ReadonlyArray<TranslationKey>;
const ACCOUNT_ERROR_UNKNOWN_KEY = "account.error.authorizationFailed" as const;
const FEEDBACK_CLEAR_MS = 3200;
const NEW_PROFILE_SELECTION = null;

const EMPTY_SIGN_IN_VM: AccountSignInViewModel = {
  isSipRegistered: false,
  hasActiveAccountSession: false,
  loginDisabledReason: null,
  sipProfileOptions: [],
  ocpProfileOptions: [],
  selectedProfile: null,
  serverState: "disconnected",
  authorizationState: { phase: "idle" },
  authorizationProgress: initialAuthorizationProgressProjection(),
  primaryRecoveryAction: null,
  allowedRecoveryActions: [],
};

function isSameSipAccountInput(left: SipAccountInput, right: SipAccountInput): boolean {
  return (
    left.username === right.username &&
    left.password === right.password &&
    left.domain === right.domain &&
    left.server === right.server
  );
}

function deriveSettingsIdentitySyncKey(identity: SettingsAccountIdentity | null): string | null {
  if (identity === null) {
    return null;
  }
  return `${identity.username}\u0000${identity.domain}\u0000${identity.server}`;
}

function buildInitialForm(): SipAccountInput {
  return {
    ...EMPTY_FORM,
    ...readSipEnvDefaults(),
  };
}

export type AccountActionsFacadeBinding = Pick<
  AccountBootstrapFacade,
  | "listSavedAccountProfiles"
  | "signInAccount"
  | "getAccountSignInViewModel"
  | "dispatchAccountRecoveryAction"
  | "cancelOcpSignInAttempt"
  | "recoverOcpSignInFromModal"
  | "deleteSavedAccountProfile"
  | "hasRememberedSipPassword"
  | "loadSavedAccountProfileSecrets"
  | "forgetRememberedSipPassword"
  | "getActiveSipAccount"
>;

type UseAccountActionsInput = Readonly<{
  facade: AccountActionsFacadeBinding | null;
  isSipRegistered?: boolean;
  registeredIdentity?: SettingsAccountIdentity | null;
}>;

type UseAccountActionsResult = Readonly<{
  form: SipAccountInput;
  ocpDraft: OcpDraftFields;
  signInMode: AccountUiSignInMode;
  submitting: boolean;
  /** Form-persistent validation errors for AccountPanel Alert. */
  error: AccountAuthorizationErrorProjection | null;
  /** Server/register failures for toast channel (never Alert). */
  notificationError: AccountAuthorizationErrorProjection | null;
  /** Last success key for inline panel feedback (toasts use `successKeys`). */
  successKey: TranslationKey | null;
  successKeys: ReadonlyArray<TranslationKey>;
  /** System State CTA on toast for notification-class sign-in failures. */
  openSystemStateAction: boolean;
  warningKey: TranslationKey | null;
  panelMode: SavedProfilePanelMode;
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
  canForgetSavedSipPassword: boolean;
  loginDisabledReasonKey: TranslationKey | null;
  serverState: AccountSignInViewModel["serverState"];
  authorizationState: AccountSignInViewModel["authorizationState"];
  authorizationProgress: AccountSignInViewModel["authorizationProgress"];
  ocpSignInModalOpen: boolean;
  allowedRecoveryActions: ReadonlyArray<OcpRecoveryAction>;
  deleteConfirmationOpen: boolean;
  deleteSubmitting: boolean;
  overwriteConfirmationOpen: boolean;
  draftDiscardConfirmationOpen: boolean;
  passwordInputRef: RefObject<HTMLInputElement | null>;
  updateField: (field: keyof SipAccountInput, value: string) => void;
  updateOcpField: (field: keyof OcpDraftFields, value: string) => void;
  setSignInMode: (mode: AccountUiSignInMode) => void;
  handleSubmit: () => void;
  selectProfile: (profileId: SavedAccountProfileId | null) => void;
  setSaveProfileChecked: (checked: boolean) => void;
  setRememberPasswordChecked: (checked: boolean) => void;
  requestDeleteSelectedProfile: (profileId: SavedAccountProfileId) => void;
  confirmDeleteSelectedProfile: () => void;
  cancelDeleteSelectedProfile: () => void;
  confirmOverwriteExistingCredentials: () => void;
  continueWithoutOverwritingCredentials: () => void;
  cancelOverwriteExistingCredentials: () => void;
  confirmDiscardDraftAndSelectProfile: () => void;
  cancelDiscardDraft: () => void;
  reloadSavedProfiles: () => void;
  handleRecoveryAction: (action: OcpRecoveryAction) => void;
  handleOcpSignInDisconnect: () => void;
  handleOcpSignInReconnect: () => void;
  handleOcpSignInSuccessSettled: () => void;
  forgetSavedSipPassword: () => void;
}>;

/**
 * - Purpose: bind Account form UI to Facade signInAccount / recovery / profile VMs (WU-04).
 * - Inputs: account bootstrap facade, SIP registration flag, registered identity.
 * - Outputs: form state, mode, OCP draft, recovery actions — no switch/logout/generic retry.
 */
export function useAccountActions(input: UseAccountActionsInput): UseAccountActionsResult {
  const {
    facade,
    isSipRegistered = false,
    registeredIdentity = null,
  } = input;
  const [form, setForm] = useState<SipAccountInput>(buildInitialForm);
  const [ocpDraft, setOcpDraft] = useState<OcpDraftFields>(EMPTY_OCP);
  const [signInMode, setSignInModeState] = useState<AccountUiSignInMode>("sip_only");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AccountAuthorizationErrorProjection | null>(null);
  const [notificationError, setNotificationError] =
    useState<AccountAuthorizationErrorProjection | null>(null);
  const [successKeys, setSuccessKeys] = useState<ReadonlyArray<TranslationKey>>([]);
  const [openSystemStateAction, setOpenSystemStateAction] = useState(false);
  const [warningKey, setWarningKey] = useState<TranslationKey | null>(null);
  const successKey = successKeys.length > 0 ? successKeys[successKeys.length - 1]! : null;
  const [savedProfiles, setSavedProfiles] = useState<ReadonlyArray<SavedAccountProfile>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<SavedAccountProfileId | null>(
    NEW_PROFILE_SELECTION,
  );
  const [saveProfileChecked, setSaveProfileChecked] = useState(false);
  const [rememberPasswordChecked, setRememberPasswordChecked] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteTargetProfileId, setDeleteTargetProfileId] =
    useState<SavedAccountProfileId | null>(null);
  const [overwriteConfirmationOpen, setOverwriteConfirmationOpen] = useState(false);
  const [pendingProfileSelection, setPendingProfileSelection] =
    useState<SavedAccountProfileId | null>(null);
  const [draftDiscardConfirmationOpen, setDraftDiscardConfirmationOpen] =
    useState(false);
  const [signInViewModel, setSignInViewModel] =
    useState<AccountSignInViewModel>(EMPTY_SIGN_IN_VM);
  const [ocpSignInModalOpen, setOcpSignInModalOpen] = useState(false);
  const ocpSignInProgressSeenRef = useRef(false);
  const feedbackClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const profileSelectionGenerationRef = useRef(0);
  const loadedProfileSecretsRef = useRef<Readonly<{
    sipPassword: string;
    ocpApiKey: string;
  }>>({ sipPassword: "", ocpApiKey: "" });
  const initialFormRef = useRef<SipAccountInput>(buildInitialForm());
  const wasSipRegisteredRef = useRef(false);
  const savedProfilesByIdRef = useRef<ReadonlyMap<SavedAccountProfileId, SavedAccountProfile>>(
    new Map(),
  );

  const ocpServerState = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.serverState,
  );
  const ocpAuthorizationPhase = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.authorizationState.phase,
  );
  const liveAuthorizationProgress = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.authorizationProgress,
  );
  // Login lock follows ADR-AF-005 account session — refresh after avatar logout.
  const hasActiveAccountSession = useAccountBootstrapStore(
    (state) => state.projection.hasActiveAccountSession,
  );

  // Global overlay: open for any OCP attempt (manual Login, modal Reconnect, SDK activate).
  useEffect(() => {
    if (shouldOpenOcpSignInProgressModal(liveAuthorizationProgress)) {
      ocpSignInProgressSeenRef.current = true;
      setOcpSignInModalOpen(true);
      return;
    }
    if (
      ocpSignInProgressSeenRef.current &&
      isColdIdleAuthorizationProgress(liveAuthorizationProgress)
    ) {
      ocpSignInProgressSeenRef.current = false;
      setOcpSignInModalOpen(false);
    }
  }, [liveAuthorizationProgress]);

  const savedProfileOptions = deriveSavedAccountProfileSelectorOptions(savedProfiles);
  const selectedProfile =
    selectedProfileId === null
      ? null
      : (savedProfilesByIdRef.current.get(selectedProfileId) ?? null);
  const registeredIdentitySyncKey = deriveSettingsIdentitySyncKey(registeredIdentity);

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
  const selectedProfileMetadataChanged =
    selectedProfile !== null &&
    (selectedProfile.username !== form.username ||
      selectedProfile.domain !== form.domain ||
      selectedProfile.server !== form.server);
  const selectedProfileCredentialsChanged =
    selectedProfile !== null &&
    (form.password !== loadedProfileSecretsRef.current.sipPassword ||
      ocpDraft.apiKey !== loadedProfileSecretsRef.current.ocpApiKey);
  const selectedProfileHasChanges =
    selectedProfileMetadataChanged ||
    selectedProfileCredentialsChanged ||
    (selectedProfile !== null &&
      (selectedProfile.ocpDomain ?? "") !== ocpDraft.domain.trim());

  const saveProfileDisabled = duplicateSavedProfile !== null && selectedProfileId === null;
  const saveProfileDisabledReasonKey: TranslationKey | null = saveProfileDisabled
    ? "account.profile.saveCheckbox.duplicate"
    : null;

  const passwordFieldVisible = signInMode === "sip_only";
  const rememberPasswordVisible = selectedProfileId === null;
  const passwordHintKey: TranslationKey | null = null;
  const rememberPasswordDisabled =
    panelMode === "newFull" && !saveProfileChecked;

  const ocpFieldVisibility = deriveOcpConfigFieldVisibility({
    selectedProfileId,
    hasCompleteOcpConfiguration:
      signInViewModel.selectedProfile?.hasCompleteOcpConfiguration === true,
    hasSavedOcpApiKey: signInViewModel.selectedProfile?.hasSavedOcpApiKey === true,
    ocpDomain:
      signInViewModel.selectedProfile?.ocpDomain ??
      selectedProfile?.ocpDomain,
  });

  const loginDisabledReasonKey: TranslationKey | null =
    signInViewModel.loginDisabledReason ??
    (signInViewModel.hasActiveAccountSession || isSipRegistered
      ? "account.signIn.disabled.logoutFirst"
      : null);

  const clearFeedbackTimer = useCallback((): void => {
    if (feedbackClearTimerRef.current !== null) {
      clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }
  }, []);

  const applySignInErrorChannels = useCallback(
    (
      mapped: AccountAuthorizationErrorProjection,
      options: Readonly<{ suppressNotification?: boolean }> = {},
    ): void => {
      const channels = assignAccountSignInErrorChannels(mapped, options);
      setError(channels.inlineError);
      setNotificationError(channels.notificationError);
      setOpenSystemStateAction(channels.attachOpenSystemStateAction);
    },
    [],
  );

  const scheduleFeedbackClear = useCallback((): void => {
    clearFeedbackTimer();
    feedbackClearTimerRef.current = setTimeout(() => {
      setError(null);
      setNotificationError(null);
      setSuccessKeys([]);
      setOpenSystemStateAction(false);
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
    setNotificationError(null);
    setSuccessKeys([]);
    setOpenSystemStateAction(false);
    setWarningKey(null);
    clearFeedbackTimer();
  }, [clearFeedbackTimer]);

  const refreshSignInViewModel = useCallback((): void => {
    if (facade === null) {
      setSignInViewModel({
        ...EMPTY_SIGN_IN_VM,
        isSipRegistered,
        hasActiveAccountSession: isSipRegistered,
        loginDisabledReason: isSipRegistered
          ? "account.signIn.disabled.logoutFirst"
          : null,
      });
      return;
    }

    void facade
      .getAccountSignInViewModel({ selectedProfileId })
      .then((result) => {
        if (result.ok) {
          setSignInViewModel(result.value);
        }
      });
  }, [facade, isSipRegistered, selectedProfileId]);

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
      refreshSignInViewModel();
    });
  }, [facade, refreshSignInViewModel]);

  useEffect(() => {
    reloadSavedProfiles();
  }, [reloadSavedProfiles]);

  useEffect(() => {
    refreshSignInViewModel();
  }, [
    refreshSignInViewModel,
    ocpServerState,
    ocpAuthorizationPhase,
    hasActiveAccountSession,
  ]);

  const resetToNewProfile = useCallback((): void => {
    profileSelectionGenerationRef.current += 1;
    setSelectedProfileId(NEW_PROFILE_SELECTION);
    loadedProfileSecretsRef.current = { sipPassword: "", ocpApiKey: "" };
    setSaveProfileChecked(false);
    setRememberPasswordChecked(false);
    setForm(buildInitialForm());
    setOcpDraft(EMPTY_OCP);
    clearFeedback();
  }, [clearFeedback]);

  useEffect(() => {
    if (wasSipRegisteredRef.current && !isSipRegistered) {
      resetToNewProfile();
    }
    wasSipRegisteredRef.current = isSipRegistered;
  }, [isSipRegistered, resetToNewProfile]);

  const applySavedProfileSelection = useCallback(
    (profileId: SavedAccountProfileId): void => {
      const profile = savedProfilesByIdRef.current.get(profileId);
      if (profile === undefined) {
        return;
      }

      setSelectedProfileId(profileId);
      loadedProfileSecretsRef.current = { sipPassword: "", ocpApiKey: "" };
      setSaveProfileChecked(false);
      setRememberPasswordChecked(false);
      setForm({
        username: profile.username,
        password: "",
        domain: profile.domain,
        server: profile.server,
      });
      setOcpDraft({
        login: profile.username,
        domain: profile.ocpDomain ?? "",
        apiKey: "",
      });
      clearFeedback();
      const selectionGeneration = profileSelectionGenerationRef.current + 1;
      profileSelectionGenerationRef.current = selectionGeneration;
      if (facade !== null) {
        void facade.loadSavedAccountProfileSecrets(profileId).then((result) => {
          if (
            profileSelectionGenerationRef.current !== selectionGeneration ||
            !result.ok
          ) {
            return;
          }
          loadedProfileSecretsRef.current = {
            sipPassword: result.value.sipPassword ?? "",
            ocpApiKey: result.value.ocpApiKey ?? "",
          };
          setForm((current) => ({
            ...current,
            password: result.value.sipPassword ?? "",
          }));
          setOcpDraft((current) => ({
            ...current,
            apiKey: result.value.ocpApiKey ?? "",
          }));
        });
      }
    },
    [clearFeedback, facade],
  );

  const selectProfile = useCallback(
    (profileId: SavedAccountProfileId | null): void => {
      if (profileId === NEW_PROFILE_SELECTION) {
        resetToNewProfile();
        return;
      }
      const hasDirtyDraft =
        selectedProfileId === null &&
        (!isSameSipAccountInput(form, initialFormRef.current) ||
          ocpDraft.login.length > 0 ||
          ocpDraft.domain.length > 0 ||
          ocpDraft.apiKey.length > 0 ||
          saveProfileChecked ||
          rememberPasswordChecked);
      if (hasDirtyDraft) {
        setPendingProfileSelection(profileId);
        setDraftDiscardConfirmationOpen(true);
        return;
      }
      applySavedProfileSelection(profileId);
    },
    [
      applySavedProfileSelection,
      form,
      ocpDraft,
      rememberPasswordChecked,
      resetToNewProfile,
      saveProfileChecked,
      selectedProfileId,
    ],
  );

  const confirmDiscardDraftAndSelectProfile = useCallback((): void => {
    if (pendingProfileSelection !== null) {
      applySavedProfileSelection(pendingProfileSelection);
    }
    setPendingProfileSelection(null);
    setDraftDiscardConfirmationOpen(false);
  }, [applySavedProfileSelection, pendingProfileSelection]);

  const cancelDiscardDraft = useCallback((): void => {
    setPendingProfileSelection(null);
    setDraftDiscardConfirmationOpen(false);
  }, []);

  const setSignInMode = useCallback(
    (mode: AccountUiSignInMode): void => {
      setSignInModeState(mode);
      const selectedSecrets =
        selectedProfileId === null
          ? { sipPassword: "", ocpApiKey: "" }
          : loadedProfileSecretsRef.current;
      setForm((current) => ({
        ...current,
        password: selectedSecrets.sipPassword,
      }));
      setOcpDraft((current) => ({
        ...current,
        apiKey: selectedSecrets.ocpApiKey,
      }));
      // Mode-local secrets/opt-ins must not leak across SIP-only ↔ OCP validation.
      if (mode === "ocp") {
        setRememberPasswordChecked(false);
      }
      clearFeedback();
    },
    [clearFeedback, selectedProfileId],
  );

  const updateField = useCallback(
    (field: keyof SipAccountInput, value: string): void => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
      if (field === "username") {
        setOcpDraft((current) => ({ ...current, login: value }));
      }
      clearFeedback();
    },
    [clearFeedback],
  );

  const updateOcpField = useCallback(
    (field: keyof OcpDraftFields, value: string): void => {
      setOcpDraft((current) => ({
        ...current,
        [field]: value,
      }));
      if (field === "login") {
        setForm((current) => ({ ...current, username: value }));
      }
      clearFeedback();
    },
    [clearFeedback],
  );

  const handleSubmit = useCallback((
    overwriteExistingCredentials = false,
    skipOverwritePrompt = false,
  ): void => {
    if (facade === null || submitting || loginDisabledReasonKey !== null) {
      return;
    }
    if (
      !skipOverwritePrompt &&
      ((selectedProfileId === null &&
        duplicateSavedProfile !== null &&
        (saveProfileChecked ||
          rememberPasswordChecked ||
          form.password.trim().length > 0 ||
          ocpDraft.apiKey.trim().length > 0)) ||
        (selectedProfileId !== null && selectedProfileHasChanges))
    ) {
      setOverwriteConfirmationOpen(true);
      return;
    }

    void (async (): Promise<void> => {
      setSubmitting(true);
      clearFeedback();
      if (signInMode === "ocp") {
        setOcpSignInModalOpen(true);
      }

      try {
        const command = buildAccountSignInCommand({
          mode: signInMode,
          selectedProfileId,
          form,
          ocp: ocpDraft,
          saveProfile: saveProfileChecked,
          rememberPassword: rememberPasswordChecked,
          passwordFieldVisible,
          showOcpDomain: ocpFieldVisibility.showDomain,
          showOcpApiKey: ocpFieldVisibility.showApiKey,
          ...(overwriteExistingCredentials ? { overwriteExistingCredentials: true } : {}),
          ...(selectedProfileMetadataChanged
            ? { authenticateAsNewDraft: true }
            : {}),
        });

        const result = await facade.signInAccount(command);
        if (isErr(result)) {
          if (overwriteExistingCredentials) {
            setOverwriteConfirmationOpen(false);
          }
          const mapped = mapAccountAuthorizationError(result.error);
          const progressSnapshot =
            useAccountBootstrapStore.getState().ocpSessionProjection.authorizationProgress;
          const modalOwnsFailure =
            signInMode === "ocp" && ocpProgressOwnsSignInFailure(progressSnapshot);
          if (
            signInMode === "ocp" &&
            progressSnapshot.executionStage === null &&
            progressSnapshot.failedExecutionStage === null &&
            progressSnapshot.completedExecutionStages.length === 0
          ) {
            setOcpSignInModalOpen(false);
          }
          applySignInErrorChannels(mapped, { suppressNotification: modalOwnsFailure });
          return;
        }

        if (
          overwriteExistingCredentials &&
          selectedProfileMetadataChanged &&
          selectedProfileId !== null
        ) {
          const deleteResult = await facade.deleteSavedAccountProfile(selectedProfileId);
          if (isErr(deleteResult)) {
            setWarningKey("account.warning.profileTouchFailed");
          }
        }

        const feedback = deriveAccountSignInNotificationFeedback({
          outcome: result.value,
          mode: signInMode,
          overwriteExistingCredentials,
        });
        setSuccessKeys(feedback.successKeys);
        setError(feedback.inlineError);
        setNotificationError(feedback.notificationError);
        setOpenSystemStateAction(feedback.attachOpenSystemStateAction);
        if (overwriteExistingCredentials) {
          setOverwriteConfirmationOpen(false);
        }
        setWarningKey(resolveMetadataWarningKey(result.value));
        scheduleFeedbackClear();
        reloadSavedProfiles();
      } catch {
        if (overwriteExistingCredentials) {
          setOverwriteConfirmationOpen(false);
        }
        applySignInErrorChannels({ key: ACCOUNT_ERROR_UNKNOWN_KEY });
      } finally {
        setSubmitting(false);
      }
    })();
  }, [
    applySignInErrorChannels,
    clearFeedback,
    duplicateSavedProfile,
    facade,
    form,
    loginDisabledReasonKey,
    ocpDraft,
    ocpFieldVisibility.showApiKey,
    ocpFieldVisibility.showDomain,
    passwordFieldVisible,
    reloadSavedProfiles,
    rememberPasswordChecked,
    saveProfileChecked,
    scheduleFeedbackClear,
    selectedProfileId,
    selectedProfileHasChanges,
    selectedProfileMetadataChanged,
    signInMode,
    submitting,
  ]);

  const confirmOverwriteExistingCredentials = useCallback((): void => {
    // Close confirm UI immediately — persist/overwrite is pre-auth inside signInAccount;
    // keeping the dialog open until SIP/OCP ready made overwrite look like a long I/O wait.
    setOverwriteConfirmationOpen(false);
    handleSubmit(true, true);
  }, [handleSubmit]);

  const cancelOverwriteExistingCredentials = useCallback((): void => {
    setOverwriteConfirmationOpen(false);
  }, []);

  const continueWithoutOverwritingCredentials = useCallback((): void => {
    setOverwriteConfirmationOpen(false);
    handleSubmit(false, true);
  }, [handleSubmit]);

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
    setDeleteSubmitting(true);

    void (async (): Promise<void> => {
      const result = await facade.deleteSavedAccountProfile(profileId);
      if (isErr(result)) {
        setDeleteSubmitting(false);
        applySignInErrorChannels(mapAccountAuthorizationError(result.error));
        return;
      }

      if (selectedProfileId === profileId) {
        resetToNewProfile();
      }

      reloadSavedProfiles();
      setDeleteSubmitting(false);
      cancelDeleteSelectedProfile();
    })();
  }, [
    applySignInErrorChannels,
    cancelDeleteSelectedProfile,
    deleteTargetProfileId,
    facade,
    reloadSavedProfiles,
    resetToNewProfile,
    selectedProfileId,
  ]);

  useEffect(() => {
    if (saveProfileDisabled && saveProfileChecked) {
      setSaveProfileChecked(false);
    }
  }, [saveProfileChecked, saveProfileDisabled]);

  useEffect(() => {
    if (rememberPasswordDisabled && rememberPasswordChecked) {
      setRememberPasswordChecked(false);
    }
  }, [rememberPasswordChecked, rememberPasswordDisabled]);

  useEffect(() => {
    if (
      facade === null ||
      !isSipRegistered ||
      registeredIdentitySyncKey === null ||
      selectedProfileId === null ||
      panelMode !== "savedFull" ||
      signInMode !== "sip_only"
    ) {
      return;
    }

    if (typeof facade.getActiveSipAccount !== "function") {
      return;
    }

    let cancelled = false;
    void (async (): Promise<void> => {
      const activeAccount = await facade.getActiveSipAccount();
      if (cancelled || activeAccount === null) {
        return;
      }

      setForm((current) => {
        if (isSameSipAccountInput(current, activeAccount)) {
          return current;
        }

        return {
          username: activeAccount.username,
          domain: activeAccount.domain,
          server: activeAccount.server,
          password: activeAccount.password,
        };
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    facade,
    isSipRegistered,
    panelMode,
    registeredIdentitySyncKey,
    selectedProfileId,
    signInMode,
  ]);

  useEffect(() => {
    if (
      selectedProfileId !== null &&
      !savedProfilesByIdRef.current.has(selectedProfileId)
    ) {
      resetToNewProfile();
    }
  }, [resetToNewProfile, savedProfiles, selectedProfileId]);

  useEffect(() => {
    if (
      panelMode === "savedPasswordOnly" &&
      passwordFieldVisible &&
      selectedProfileId !== null
    ) {
      queueMicrotask(() => {
        passwordInputRef.current?.focus();
      });
    }
  }, [
    panelMode,
    passwordFieldVisible,
    selectedProfileId,
  ]);

  const handleRecoveryAction = useCallback(
    (action: OcpRecoveryAction): void => {
      if (facade === null || submitting) {
        return;
      }
      if (!signInViewModel.allowedRecoveryActions.includes(action)) {
        return;
      }

      void (async (): Promise<void> => {
        setSubmitting(true);
        clearFeedback();
        try {
          const result = await facade.dispatchAccountRecoveryAction(action);
          if (isErr(result)) {
            scheduleFeedbackClear();
            return;
          }
          setSuccessKeys([...SIP_READY_SUCCESS_KEYS]);
          setOpenSystemStateAction(false);
          scheduleFeedbackClear();
          reloadSavedProfiles();
        } catch {
          applySignInErrorChannels({ key: ACCOUNT_ERROR_UNKNOWN_KEY });
        } finally {
          setSubmitting(false);
        }
      })();
    },
    [
      applySignInErrorChannels,
      clearFeedback,
      facade,
      reloadSavedProfiles,
      scheduleFeedbackClear,
      signInViewModel.allowedRecoveryActions,
      submitting,
    ],
  );

  const handleOcpSignInDisconnect = useCallback((): void => {
    if (facade === null) {
      ocpSignInProgressSeenRef.current = false;
      setOcpSignInModalOpen(false);
      return;
    }
    void (async (): Promise<void> => {
      setSubmitting(true);
      clearFeedback();
      try {
        await facade.cancelOcpSignInAttempt();
      } finally {
        ocpSignInProgressSeenRef.current = false;
        setOcpSignInModalOpen(false);
        setSubmitting(false);
        refreshSignInViewModel();
      }
    })();
  }, [clearFeedback, facade, refreshSignInViewModel]);

  const handleOcpSignInReconnect = useCallback((): void => {
    if (facade === null || submitting) {
      return;
    }
    // Application-owned recovery (ADR-AF-005): never signInAccount / identity gate.
    void (async (): Promise<void> => {
      setSubmitting(true);
      clearFeedback();
      setOcpSignInModalOpen(true);
      try {
        const result = await facade.recoverOcpSignInFromModal();
        if (isErr(result)) {
          // Modal owns failure UX — never dual toast/Alert for the same outcome.
          applySignInErrorChannels(mapAccountAuthorizationError(result.error), {
            suppressNotification: true,
          });
          return;
        }
        setSuccessKeys([...SIP_READY_SUCCESS_KEYS]);
        setOpenSystemStateAction(false);
        scheduleFeedbackClear();
        refreshSignInViewModel();
        reloadSavedProfiles();
      } catch {
        applySignInErrorChannels(
          { key: ACCOUNT_ERROR_UNKNOWN_KEY },
          { suppressNotification: true },
        );
      } finally {
        setSubmitting(false);
      }
    })();
  }, [
    applySignInErrorChannels,
    clearFeedback,
    facade,
    refreshSignInViewModel,
    reloadSavedProfiles,
    scheduleFeedbackClear,
    submitting,
  ]);

  const handleOcpSignInSuccessSettled = useCallback((): void => {
    ocpSignInProgressSeenRef.current = false;
    setOcpSignInModalOpen(false);
  }, []);

  const forgetSavedSipPassword = useCallback((): void => {
    if (facade === null || selectedProfileId === null || submitting) {
      return;
    }
    void (async (): Promise<void> => {
      setSubmitting(true);
      const result = await facade.forgetRememberedSipPassword(selectedProfileId);
      if (result.ok) {
        loadedProfileSecretsRef.current = {
          ...loadedProfileSecretsRef.current,
          sipPassword: "",
        };
        setForm((current) => ({ ...current, password: "" }));
        refreshSignInViewModel();
      } else {
        applySignInErrorChannels(mapAccountAuthorizationError(result.error));
      }
      setSubmitting(false);
    })();
  }, [
    applySignInErrorChannels,
    facade,
    refreshSignInViewModel,
    selectedProfileId,
    submitting,
  ]);

  return {
    form,
    ocpDraft,
    signInMode,
    submitting,
    error,
    notificationError,
    successKey,
    successKeys,
    openSystemStateAction,
    warningKey,
    panelMode,
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
    showOcpDomainField: ocpFieldVisibility.showDomain,
    showOcpApiKeyField: ocpFieldVisibility.showApiKey,
    hasSavedOcpApiKey: signInViewModel.selectedProfile?.hasSavedOcpApiKey === true,
    canForgetSavedSipPassword:
      selectedProfileId !== null &&
      signInViewModel.selectedProfile?.hasSavedSipPassword === true,
    loginDisabledReasonKey,
    serverState: signInViewModel.serverState,
    authorizationState: signInViewModel.authorizationState,
    authorizationProgress: liveAuthorizationProgress,
    ocpSignInModalOpen,
    allowedRecoveryActions: signInViewModel.allowedRecoveryActions,
    deleteConfirmationOpen,
    deleteSubmitting,
    overwriteConfirmationOpen,
    draftDiscardConfirmationOpen,
    passwordInputRef,
    updateField,
    updateOcpField,
    setSignInMode,
    handleSubmit,
    selectProfile,
    setSaveProfileChecked,
    setRememberPasswordChecked,
    requestDeleteSelectedProfile,
    confirmDeleteSelectedProfile,
    cancelDeleteSelectedProfile,
    confirmOverwriteExistingCredentials,
    cancelOverwriteExistingCredentials,
    confirmDiscardDraftAndSelectProfile,
    cancelDiscardDraft,
    continueWithoutOverwritingCredentials,
    reloadSavedProfiles,
    handleRecoveryAction,
    handleOcpSignInDisconnect,
    handleOcpSignInReconnect,
    handleOcpSignInSuccessSettled,
    forgetSavedSipPassword,
  };
}

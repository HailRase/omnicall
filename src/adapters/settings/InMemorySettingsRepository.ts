import type {
  AppBootstrapConfig,
  BreakReason,
  MultiCallSettings,
  PhoneStatus,
  SettingsAccountKey,
  SipAccount,
  UserSettings,
} from "@domain/index.js";
import {
  createBreakReason,
  createDefaultUserSettings,
  mergeMultiCallIntoUserSettings,
  resolveSettingsAccountKeyFromSipAccount,
  toAutoAnswerDuringActiveSessionEnabled,
  toAutoAnswerTimeoutSec,
  toMultiCallSettings,
  validateUserSettings,
} from "@domain/index.js";
import {
  type IncomingCallSettings,
  type SettingsRepository,
} from "@ports/index.js";

export type InMemorySettingsState = Readonly<{
  bootstrapConfig: AppBootstrapConfig;
  sipAccount: SipAccount | null;
  activeProfileKey: SettingsAccountKey;
  phoneStatus: PhoneStatus;
  incomingCallSettings: IncomingCallSettings;
  multiCallSettings: MultiCallSettings;
  userSettingsByAccount: ReadonlyMap<SettingsAccountKey, UserSettings>;
}>;

export class InMemorySettingsRepository implements SettingsRepository {
  private state: InMemorySettingsState;

  constructor(initial?: Partial<InMemorySettingsState>) {
    const defaultUserSettings = createDefaultUserSettings();
    const sipAccount = initial?.sipAccount ?? null;
    const activeProfileKey =
      initial?.activeProfileKey ?? resolveSettingsAccountKeyFromSipAccount(sipAccount);
    const multiCallSettings = initial?.multiCallSettings ?? {
      multiSessionsEnabled: defaultUserSettings.multiSessionsEnabled,
      autoUnholdOnTransferFailure: defaultUserSettings.autoUnholdOnTransferFailure,
    };
    const incomingCallSettings = initial?.incomingCallSettings ?? {
      autoAnswerTimeoutSec: defaultUserSettings.autoAnswerTimeoutSec,
      autoAnswerDuringActiveSessionEnabled:
        defaultUserSettings.autoAnswerDuringActiveSessionEnabled,
      rejectReasonRequired: false,
      allowedBreakReasons: defaultBreakReasons(),
    };
    const userSettingsByAccount = new Map<SettingsAccountKey, UserSettings>(
      initial?.userSettingsByAccount ?? [
        [
          activeProfileKey,
          seedUserSettings(multiCallSettings, incomingCallSettings),
        ],
      ],
    );

    this.state = {
      bootstrapConfig: initial?.bootstrapConfig ?? { mode: "sip-only" },
      sipAccount,
      activeProfileKey,
      phoneStatus: initial?.phoneStatus ?? "offline",
      incomingCallSettings,
      multiCallSettings,
      userSettingsByAccount,
    };
  }

  getState(): InMemorySettingsState {
    return this.state;
  }

  getBootstrapConfig(): Promise<AppBootstrapConfig> {
    return Promise.resolve(this.state.bootstrapConfig);
  }

  getSipAccount(): Promise<SipAccount | null> {
    return Promise.resolve(this.state.sipAccount);
  }

  saveSipAccount(account: SipAccount): Promise<void> {
    this.state = { ...this.state, sipAccount: account };
    return Promise.resolve();
  }

  getPhoneStatus(): Promise<PhoneStatus> {
    return Promise.resolve(this.state.phoneStatus);
  }

  setPhoneStatus(status: PhoneStatus): Promise<void> {
    this.state = { ...this.state, phoneStatus: status };
    return Promise.resolve();
  }

  getActiveProfileKey(): Promise<SettingsAccountKey> {
    return Promise.resolve(this.state.activeProfileKey);
  }

  async setActiveProfileKey(accountKey: SettingsAccountKey): Promise<void> {
    const userSettings = await this.getUserSettings(accountKey);
    this.state = {
      ...this.state,
      activeProfileKey: accountKey,
      multiCallSettings: toMultiCallSettings(userSettings),
      incomingCallSettings: {
        ...this.state.incomingCallSettings,
        autoAnswerTimeoutSec: userSettings.autoAnswerTimeoutSec,
        autoAnswerDuringActiveSessionEnabled:
          userSettings.autoAnswerDuringActiveSessionEnabled,
      },
    };
  }

  listKnownProfileKeys(): Promise<ReadonlyArray<SettingsAccountKey>> {
    const keys = [...this.state.userSettingsByAccount.keys()].sort((left, right) =>
      left.localeCompare(right),
    );
    return Promise.resolve(keys);
  }

  getIncomingCallSettings(): Promise<IncomingCallSettings> {
    const userSettings = this.readCurrentUserSettings();
    return Promise.resolve({
      ...this.state.incomingCallSettings,
      autoAnswerTimeoutSec: toAutoAnswerTimeoutSec(userSettings),
      autoAnswerDuringActiveSessionEnabled:
        toAutoAnswerDuringActiveSessionEnabled(userSettings),
    });
  }

  setAllowedBreakReasons(reasons: ReadonlyArray<BreakReason>): Promise<void> {
    this.state = {
      ...this.state,
      incomingCallSettings: {
        ...this.state.incomingCallSettings,
        allowedBreakReasons: reasons,
        rejectReasonRequired: reasons.length > 0,
      },
    };
    return Promise.resolve();
  }

  getMultiCallSettings(): Promise<MultiCallSettings> {
    return Promise.resolve(toMultiCallSettings(this.readCurrentUserSettings()));
  }

  async setMultiCallSettings(settings: MultiCallSettings): Promise<void> {
    const accountKey = this.state.activeProfileKey;
    const current = await this.getUserSettings(accountKey);
    const next = mergeMultiCallIntoUserSettings(current, settings);
    await this.saveUserSettings(accountKey, next);
  }

  getUserSettings(accountKey: SettingsAccountKey): Promise<UserSettings> {
    const stored = this.state.userSettingsByAccount.get(accountKey);
    if (stored !== undefined) {
      return Promise.resolve(stored);
    }
    return Promise.resolve(createDefaultUserSettings());
  }

  async saveUserSettings(
    accountKey: SettingsAccountKey,
    settings: UserSettings,
  ): Promise<void> {
    const validated = validateUserSettings(settings);
    if (!validated.ok) {
      throw new Error(`settings_validation_failed:${validated.errors.join(",")}`);
    }

    const nextMap = new Map(this.state.userSettingsByAccount);
    nextMap.set(accountKey, validated.value);

    const isActiveProfile = accountKey === this.state.activeProfileKey;
    this.state = {
      ...this.state,
      userSettingsByAccount: nextMap,
      ...(isActiveProfile
        ? {
            multiCallSettings: toMultiCallSettings(validated.value),
            incomingCallSettings: {
              ...this.state.incomingCallSettings,
              autoAnswerTimeoutSec: validated.value.autoAnswerTimeoutSec,
              autoAnswerDuringActiveSessionEnabled:
                validated.value.autoAnswerDuringActiveSessionEnabled,
            },
          }
        : {}),
    };
    return Promise.resolve();
  }

  private readCurrentUserSettings(): UserSettings {
    return (
      this.state.userSettingsByAccount.get(this.state.activeProfileKey) ??
      createDefaultUserSettings()
    );
  }
}

function seedUserSettings(
  multiCallSettings: MultiCallSettings,
  incomingCallSettings: IncomingCallSettings,
): UserSettings {
  const defaults = createDefaultUserSettings();
  return {
    ...defaults,
    multiSessionsEnabled: multiCallSettings.multiSessionsEnabled,
    autoUnholdOnTransferFailure: multiCallSettings.autoUnholdOnTransferFailure !== false,
    autoAnswerTimeoutSec: incomingCallSettings.autoAnswerTimeoutSec,
    autoAnswerDuringActiveSessionEnabled:
      incomingCallSettings.autoAnswerDuringActiveSessionEnabled,
  };
}

function defaultBreakReasons(): ReadonlyArray<BreakReason> {
  return [
    createBreakReason("break"),
    createBreakReason("meeting"),
    createBreakReason("training"),
  ];
}

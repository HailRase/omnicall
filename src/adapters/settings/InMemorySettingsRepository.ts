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
  ANONYMOUS_SETTINGS_ACCOUNT,
  createBreakReason,
  createDefaultUserSettings,
  createSettingsAccountKey,
  mergeMultiCallIntoUserSettings,
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
  phoneStatus: PhoneStatus;
  incomingCallSettings: IncomingCallSettings;
  multiCallSettings: MultiCallSettings;
  userSettingsByAccount: ReadonlyMap<SettingsAccountKey, UserSettings>;
}>;

export class InMemorySettingsRepository implements SettingsRepository {
  private state: InMemorySettingsState;

  constructor(initial?: Partial<InMemorySettingsState>) {
    const defaultUserSettings = createDefaultUserSettings();
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
    const accountKey = resolveAccountKey(initial?.sipAccount ?? null);
    const userSettingsByAccount = new Map<SettingsAccountKey, UserSettings>(
      initial?.userSettingsByAccount ?? [
        [
          accountKey,
          seedUserSettings(multiCallSettings, incomingCallSettings),
        ],
      ],
    );

    this.state = {
      bootstrapConfig: initial?.bootstrapConfig ?? { mode: "sip-only" },
      sipAccount: initial?.sipAccount ?? null,
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
    const accountKey = this.resolveCurrentAccountKey();
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
    this.state = {
      ...this.state,
      userSettingsByAccount: nextMap,
      multiCallSettings: toMultiCallSettings(validated.value),
      incomingCallSettings: {
        ...this.state.incomingCallSettings,
        autoAnswerTimeoutSec: validated.value.autoAnswerTimeoutSec,
        autoAnswerDuringActiveSessionEnabled:
          validated.value.autoAnswerDuringActiveSessionEnabled,
      },
    };
    return Promise.resolve();
  }

  private readCurrentUserSettings(): UserSettings {
    const accountKey = this.resolveCurrentAccountKey();
    return (
      this.state.userSettingsByAccount.get(accountKey) ?? createDefaultUserSettings()
    );
  }

  private resolveCurrentAccountKey(): SettingsAccountKey {
    return resolveAccountKey(this.state.sipAccount);
  }
}

function resolveAccountKey(sipAccount: SipAccount | null): SettingsAccountKey {
  if (sipAccount === null) {
    return createSettingsAccountKey(ANONYMOUS_SETTINGS_ACCOUNT);
  }
  return createSettingsAccountKey(sipAccount.username);
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

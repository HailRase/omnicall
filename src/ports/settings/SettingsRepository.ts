import type {
  AppBootstrapConfig,
  BreakReason,
  MultiCallSettings,
  PhoneStatus,
  SettingsAccountKey,
  SipAccount,
  UserSettings,
} from "@domain/index.js";

export type IncomingCallSettings = Readonly<{
  autoAnswerTimeoutSec: number | null;
  rejectReasonRequired: boolean;
  allowedBreakReasons: ReadonlyArray<BreakReason>;
}>;

export interface SettingsRepository {
  getBootstrapConfig(): Promise<AppBootstrapConfig>;
  getSipAccount(): Promise<SipAccount | null>;
  saveSipAccount(account: SipAccount): Promise<void>;
  getPhoneStatus(): Promise<PhoneStatus>;
  setPhoneStatus(status: PhoneStatus): Promise<void>;
  getIncomingCallSettings(): Promise<IncomingCallSettings>;
  setAllowedBreakReasons(reasons: ReadonlyArray<BreakReason>): Promise<void>;
  getMultiCallSettings(): Promise<MultiCallSettings>;
  setMultiCallSettings(settings: MultiCallSettings): Promise<void>;
  getUserSettings(accountKey: SettingsAccountKey): Promise<UserSettings>;
  saveUserSettings(accountKey: SettingsAccountKey, settings: UserSettings): Promise<void>;
}

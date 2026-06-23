import type {
  AppBootstrapConfig,
  BreakReason,
  MultiCallSettings,
  PhoneStatus,
  SipAccount,
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
  getMultiCallSettings(): Promise<MultiCallSettings>;
}

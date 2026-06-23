import type {
  AppBootstrapConfig,
  PhoneStatus,
  SipAccount,
} from "@domain/index.js";

export interface SettingsRepository {
  getBootstrapConfig(): Promise<AppBootstrapConfig>;
  getSipAccount(): Promise<SipAccount | null>;
  saveSipAccount(account: SipAccount): Promise<void>;
  getPhoneStatus(): Promise<PhoneStatus>;
  setPhoneStatus(status: PhoneStatus): Promise<void>;
}

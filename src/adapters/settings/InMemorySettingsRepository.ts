import type {
  AppBootstrapConfig,
  PhoneStatus,
  SipAccount,
} from "@domain/index.js";
import type { SettingsRepository } from "@ports/index.js";

export type InMemorySettingsState = Readonly<{
  bootstrapConfig: AppBootstrapConfig;
  sipAccount: SipAccount | null;
  phoneStatus: PhoneStatus;
}>;

export class InMemorySettingsRepository implements SettingsRepository {
  private state: InMemorySettingsState;

  constructor(initial?: Partial<InMemorySettingsState>) {
    this.state = {
      bootstrapConfig: initial?.bootstrapConfig ?? { mode: "sip-only" },
      sipAccount: initial?.sipAccount ?? null,
      phoneStatus: initial?.phoneStatus ?? "offline",
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
}

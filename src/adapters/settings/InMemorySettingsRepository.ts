import type {
  AppBootstrapConfig,
  BreakReason,
  MultiCallSettings,
  PhoneStatus,
  SipAccount,
} from "@domain/index.js";
import { createBreakReason } from "@domain/index.js";
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
}>;

export class InMemorySettingsRepository implements SettingsRepository {
  private state: InMemorySettingsState;

  constructor(initial?: Partial<InMemorySettingsState>) {
    this.state = {
      bootstrapConfig: initial?.bootstrapConfig ?? { mode: "sip-only" },
      sipAccount: initial?.sipAccount ?? null,
      phoneStatus: initial?.phoneStatus ?? "offline",
      incomingCallSettings: initial?.incomingCallSettings ?? {
        autoAnswerTimeoutSec: null,
        rejectReasonRequired: false,
        allowedBreakReasons: defaultBreakReasons(),
      },
      multiCallSettings: initial?.multiCallSettings ?? {
        multiSessionsEnabled: true,
        autoUnholdOnTransferFailure: true,
      },
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
    return Promise.resolve(this.state.incomingCallSettings);
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
    return Promise.resolve(this.state.multiCallSettings);
  }
}

function defaultBreakReasons(): ReadonlyArray<BreakReason> {
  return [
    createBreakReason("break"),
    createBreakReason("meeting"),
    createBreakReason("training"),
  ];
}

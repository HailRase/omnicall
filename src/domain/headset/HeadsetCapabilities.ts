export type HeadsetCapabilities = Readonly<{
  supportsAnswer: boolean;
  supportsReject: boolean;
  supportsHangup: boolean;
  supportsHold: boolean;
  supportsMute: boolean;
  supportsOutgoingSignal: boolean;
  supportsIncomingSignal: boolean;
  supportsRejectOnHookOn: boolean;
}>;

export function createDefaultHeadsetCapabilities(): HeadsetCapabilities {
  return {
    supportsAnswer: false,
    supportsReject: false,
    supportsHangup: false,
    supportsHold: false,
    supportsMute: false,
    supportsOutgoingSignal: false,
    supportsIncomingSignal: false,
    supportsRejectOnHookOn: false,
  };
}

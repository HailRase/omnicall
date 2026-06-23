export type SipAccountId = string & { readonly __brand: "SipAccountId" };

export type OperatorSessionId = string & {
  readonly __brand: "OperatorSessionId";
};

export function createSipAccountId(value: string): SipAccountId {
  return value as SipAccountId;
}

export function createOperatorSessionId(value: string): OperatorSessionId {
  return value as OperatorSessionId;
}

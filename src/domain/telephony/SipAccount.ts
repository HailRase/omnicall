import type { SipAccountId } from "../shared/ids.js";

export type SipAccount = Readonly<{
  id: SipAccountId;
  uri: string;
  username: string;
  password: string;
  displayName: string;
  registrar: string;
}>;

export type SipAccountInput = Readonly<{
  uri: string;
  username: string;
  password: string;
  displayName: string;
  registrar: string;
}>;

export function createSipAccount(
  id: SipAccountId,
  input: SipAccountInput,
): SipAccount {
  return {
    id,
    uri: input.uri.trim(),
    username: input.username.trim(),
    password: input.password,
    displayName: input.displayName.trim(),
    registrar: input.registrar.trim(),
  };
}

export function validateSipAccountInput(
  input: SipAccountInput,
): ReadonlyArray<string> {
  const errors: string[] = [];

  if (input.username.trim().length === 0) {
    errors.push("username_required");
  }

  if (input.registrar.trim().length === 0) {
    errors.push("registrar_required");
  }

  if (input.password.length === 0) {
    errors.push("password_required");
  }

  return errors;
}

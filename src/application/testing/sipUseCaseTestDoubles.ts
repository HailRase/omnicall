/**
 * - Purpose: typed structural stubs for SIP authorize/register Use Cases in unit tests.
 * - Inputs: execute handler implementations.
 * - Outputs: Pick stubs satisfying OcpSipCredentialService / orchestration deps.
 */

import type { AuthorizeSipAccountUseCase } from "../use-cases/settings/AuthorizeSipAccountUseCase.js";
import type { PromoteAuthorizedSipSessionUseCase } from "../use-cases/settings/PromoteAuthorizedSipSessionUseCase.js";
import type { RegisterAccountUseCase } from "../use-cases/settings/RegisterAccountUseCase.js";
import { ok } from "@shared/result/index.js";

export type AuthorizeSipAccountExecute = AuthorizeSipAccountUseCase["execute"];
export type RegisterAccountExecute = RegisterAccountUseCase["execute"];
export type PromoteAuthorizedSipSessionExecute =
  PromoteAuthorizedSipSessionUseCase["execute"];

export function createAuthorizeSipAccountStub(
  execute: AuthorizeSipAccountExecute,
): Pick<AuthorizeSipAccountUseCase, "execute"> {
  return { execute };
}

export function createRegisterAccountStub(
  execute: RegisterAccountExecute,
): Pick<RegisterAccountUseCase, "execute"> {
  return { execute };
}

export function createPromoteAuthorizedSipSessionStub(
  execute: PromoteAuthorizedSipSessionExecute = () => Promise.resolve(ok(undefined)),
): Pick<PromoteAuthorizedSipSessionUseCase, "execute"> {
  return { execute };
}

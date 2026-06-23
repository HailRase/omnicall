export type { BootstrapMode, AppBootstrapConfig } from "./settings/BootstrapConfig.js";
export type { DomainEvent, DomainEventBase } from "./shared/DomainEvent.js";
export { createDomainEvent } from "./shared/DomainEvent.js";
export type {
  OperatorSessionId,
  SipAccountId,
} from "./shared/ids.js";
export {
  createOperatorSessionId,
  createSipAccountId,
} from "./shared/ids.js";
export type { PhoneStatus } from "./shared/PhoneStatus.js";
export {
  isPhoneStatus,
  phoneStatusLabel,
  PHONE_STATUSES,
} from "./shared/PhoneStatus.js";
export type {
  OcpAuthFailureReason,
  OcpAuthResult,
  OcpSipCredentials,
  OperatorSession,
} from "./operator/OperatorSession.js";
export type {
  OperatorAuthDomainEvent,
  OcpAuthenticationFailedEvent,
  OcpAuthenticationRequestedEvent,
  OcpAuthenticationSucceededEvent,
  SipCredentialsReceivedEvent,
} from "./operator/events/operatorAuthEvents.js";
export {
  createOcpAuthenticationFailedEvent,
  createOcpAuthenticationRequestedEvent,
  createOcpAuthenticationSucceededEvent,
  createSipCredentialsReceivedEvent,
} from "./operator/events/operatorAuthEvents.js";
export type {
  SipAccount,
  SipAccountInput,
} from "./telephony/SipAccount.js";
export {
  createSipAccount,
  validateSipAccountInput,
} from "./telephony/SipAccount.js";
export type { RegistrationState } from "./telephony/RegistrationState.js";
export {
  initialRegistrationState,
  REGISTRATION_STATES,
  transitionRegistrationState,
} from "./telephony/RegistrationState.js";
export type {
  RegistrationDomainEvent,
  RegistrationFailedEvent,
  RegistrationRequestedEvent,
  RegistrationSucceededEvent,
} from "./telephony/events/registrationEvents.js";
export {
  createRegistrationFailedEvent,
  createRegistrationRequestedEvent,
  createRegistrationSucceededEvent,
} from "./telephony/events/registrationEvents.js";

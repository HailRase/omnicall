import type { SipSessionHealth } from "@domain/telephony/SipSessionHealth.js";

export type SipSessionHealthReadModelSnapshot = SipSessionHealth;

export interface SipSessionHealthReadModel {
  getSnapshot(): SipSessionHealthReadModelSnapshot;
}

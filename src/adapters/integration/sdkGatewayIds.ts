/**
 * Opaque ID / nonce helpers for the loopback SDK gateway (DI-03).
 * Values are protocol-safe; never log them as secrets beyond allowlisted fields.
 */

import { randomBytes } from "node:crypto";

export function createSdkOpaqueId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function createSdkBase64UrlNonce(byteLength = 16): string {
  return randomBytes(byteLength).toString("base64url");
}

export function createSdkIsoTimestamp(now: () => Date = () => new Date()): string {
  return now().toISOString();
}

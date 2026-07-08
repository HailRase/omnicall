import { describe, expect, it } from "vitest";
import {
  parseSecretStorageOperation,
  parseSecretStorageResponse,
} from "./SecretStorageContract.js";

describe("parseSecretStorageOperation", () => {
  it("accepts save operation with bounded secret value", () => {
    expect(
      parseSecretStorageOperation({
        op: "save",
        scopeKey: "user@example.com",
        secretId: "sip-password",
        value: "secret",
      }),
    ).toEqual({
      op: "save",
      scopeKey: "user@example.com",
      secretId: "sip-password",
      value: "secret",
    });
  });

  it("rejects save operation with empty scope key", () => {
    expect(
      parseSecretStorageOperation({
        op: "save",
        scopeKey: " ",
        secretId: "sip-password",
        value: "secret",
      }),
    ).toBeNull();
  });

  it("accepts load and delete operations", () => {
    expect(
      parseSecretStorageOperation({
        op: "load",
        scopeKey: "user@example.com",
        secretId: "sip-password",
      }),
    ).toEqual({
      op: "load",
      scopeKey: "user@example.com",
      secretId: "sip-password",
    });
  });
});

describe("parseSecretStorageResponse", () => {
  it("accepts successful load response with null value", () => {
    expect(parseSecretStorageResponse({ ok: true, value: null })).toEqual({
      ok: true,
      value: null,
    });
  });

  it("accepts failed response with reason", () => {
    expect(parseSecretStorageResponse({ ok: false, reason: "encryption_unavailable" })).toEqual({
      ok: false,
      reason: "encryption_unavailable",
    });
  });
});

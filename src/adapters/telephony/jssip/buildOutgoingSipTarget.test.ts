import { describe, expect, it } from "vitest";
import { createPhoneNumber, createSipAccount, createSipAccountId } from "@domain/index.js";
import { buildOutgoingSipTarget } from "./buildOutgoingSipTarget.js";

describe("buildOutgoingSipTarget", () => {
  const account = createSipAccount(createSipAccountId("agent"), {
    username: "agent",
    password: "secret",
    domain: "dev-qms.onedemoserver.online",
    server: "wss://onedemoserver.online:7443",
  });

  it("builds sip uri from phone number and account domain", () => {
    expect(buildOutgoingSipTarget(createPhoneNumber("200"), account)).toBe(
      "sip:200@dev-qms.onedemoserver.online",
    );
  });

  it("passes through sip-prefixed targets unchanged", () => {
    expect(buildOutgoingSipTarget(createPhoneNumber("sip:bob@other.example"), account)).toBe(
      "sip:bob@other.example",
    );
  });
});

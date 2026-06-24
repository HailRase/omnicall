import { describe, expect, it } from "vitest";
import { createPhoneNumber, createSipAccount, createSipAccountId } from "@domain/index.js";
import { buildOutgoingSipTarget } from "./buildOutgoingSipTarget.js";

describe("buildOutgoingSipTarget", () => {
  const account = createSipAccount(createSipAccountId("agent"), {
    uri: "sip:agent@pbx.example",
    username: "agent",
    password: "secret",
    displayName: "Agent",
    registrar: "wss://pbx.example:7443",
  });

  it("builds sip uri from phone number and registrar host", () => {
    expect(buildOutgoingSipTarget(createPhoneNumber("200"), account)).toBe(
      "sip:200@pbx.example",
    );
  });

  it("passes through sip-prefixed targets unchanged", () => {
    expect(buildOutgoingSipTarget(createPhoneNumber("sip:bob@other.example"), account)).toBe(
      "sip:bob@other.example",
    );
  });
});

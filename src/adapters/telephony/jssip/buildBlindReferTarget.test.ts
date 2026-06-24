import { describe, expect, it } from "vitest";
import { createPhoneNumber, createSipAccount, createSipAccountId } from "@domain/index.js";
import {
  buildBlindReferTarget,
  classifyReferTargetKind,
} from "./buildBlindReferTarget.js";

describe("classifyReferTargetKind", () => {
  it("classifies short extensions as on_net", () => {
    expect(classifyReferTargetKind(createPhoneNumber("200"))).toBe("on_net");
    expect(classifyReferTargetKind(createPhoneNumber("401"))).toBe("on_net");
  });

  it("classifies E.164 numbers as off_net", () => {
    expect(classifyReferTargetKind(createPhoneNumber("+79001234567"))).toBe("off_net");
  });

  it("classifies long national digit strings as off_net", () => {
    expect(classifyReferTargetKind(createPhoneNumber("89001234567"))).toBe("off_net");
    expect(classifyReferTargetKind(createPhoneNumber("12025550100"))).toBe("off_net");
  });

  it("treats explicit sip URIs as on_net", () => {
    expect(classifyReferTargetKind(createPhoneNumber("sip:bob@other.example"))).toBe(
      "on_net",
    );
  });
});

describe("buildBlindReferTarget", () => {
  const account = createSipAccount(createSipAccountId("agent"), {
    username: "agent",
    password: "secret",
    domain: "dev-qms.onedemoserver.online",
    server: "wss://onedemoserver.online:7443",
  });

  it("builds sip uri for on-net extensions", () => {
    expect(buildBlindReferTarget(createPhoneNumber("200"), account)).toEqual({
      target: "sip:200@dev-qms.onedemoserver.online",
      kind: "on_net",
    });
  });

  it("builds sip uri for E.164 off-net targets", () => {
    expect(buildBlindReferTarget(createPhoneNumber("+79001234567"), account)).toEqual({
      target: "sip:+79001234567@dev-qms.onedemoserver.online",
      kind: "off_net",
    });
  });

  it("builds sip uri for national off-net targets without plus", () => {
    expect(buildBlindReferTarget(createPhoneNumber("89001234567"), account)).toEqual({
      target: "sip:89001234567@dev-qms.onedemoserver.online",
      kind: "off_net",
    });
  });

  it("passes through sip-prefixed targets unchanged", () => {
    expect(
      buildBlindReferTarget(createPhoneNumber("sip:bob@other.example"), account),
    ).toEqual({
      target: "sip:bob@other.example",
      kind: "on_net",
    });
  });
});

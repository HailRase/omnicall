import { describe, expect, it } from "vitest";

import {
  isApprovedLoopbackBindHost,
  isLoopbackRemoteAddress,
} from "./sdkGatewayPeer.js";

describe("sdkGatewayPeer", () => {
  it("accepts IPv4 and IPv6 loopback addresses", () => {
    expect(isLoopbackRemoteAddress("127.0.0.1")).toBe(true);
    expect(isLoopbackRemoteAddress("::1")).toBe(true);
    expect(isLoopbackRemoteAddress("::ffff:127.0.0.1")).toBe(true);
  });

  it("rejects non-loopback, hostnames, and empty peers", () => {
    expect(isLoopbackRemoteAddress("192.168.1.10")).toBe(false);
    expect(isLoopbackRemoteAddress("10.0.0.1")).toBe(false);
    expect(isLoopbackRemoteAddress("localhost")).toBe(false);
    expect(isLoopbackRemoteAddress(undefined)).toBe(false);
    expect(isLoopbackRemoteAddress("")).toBe(false);
  });

  it("allows only explicit loopback bind hosts", () => {
    expect(isApprovedLoopbackBindHost("127.0.0.1")).toBe(true);
    expect(isApprovedLoopbackBindHost("::1")).toBe(true);
    expect(isApprovedLoopbackBindHost("0.0.0.0")).toBe(false);
    expect(isApprovedLoopbackBindHost("::")).toBe(false);
    expect(isApprovedLoopbackBindHost("localhost")).toBe(false);
    expect(isApprovedLoopbackBindHost("192.168.1.10")).toBe(false);
    expect(isApprovedLoopbackBindHost("")).toBe(false);
  });
});

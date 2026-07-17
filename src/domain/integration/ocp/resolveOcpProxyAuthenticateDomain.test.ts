import { describe, expect, it } from "vitest";
import { resolveOcpProxyAuthenticateDomain } from "./resolveOcpProxyAuthenticateDomain.js";

describe("resolveOcpProxyAuthenticateDomain", () => {
  it("prefers settings OCP domain when distinct from SIP", () => {
    expect(
      resolveOcpProxyAuthenticateDomain({
        settingsOcpDomain: "ocp.example",
        profileOcpDomain: "profile-ocp.example",
        sessionOcpDomain: "session-ocp.example",
        sipAccountDomain: "pbx.example",
      }),
    ).toBe("ocp.example");
  });

  it("heals settings polluted with SIP domain using profile or session OCP host", () => {
    expect(
      resolveOcpProxyAuthenticateDomain({
        settingsOcpDomain: "pbx.example",
        profileOcpDomain: "ocp.example",
        sessionOcpDomain: "pbx.example",
        sipAccountDomain: "pbx.example",
      }),
    ).toBe("ocp.example");

    expect(
      resolveOcpProxyAuthenticateDomain({
        settingsOcpDomain: "pbx.example",
        sessionOcpDomain: "ocp.example",
        sipAccountDomain: "pbx.example",
      }),
    ).toBe("ocp.example");
  });

  it("falls back to profile then session when settings empty", () => {
    expect(
      resolveOcpProxyAuthenticateDomain({
        settingsOcpDomain: "  ",
        profileOcpDomain: "ocp.example",
        sessionOcpDomain: "session.example",
      }),
    ).toBe("ocp.example");

    expect(
      resolveOcpProxyAuthenticateDomain({
        settingsOcpDomain: "",
        sessionOcpDomain: "session.example",
      }),
    ).toBe("session.example");
  });

  it("returns empty when no candidate is usable", () => {
    expect(
      resolveOcpProxyAuthenticateDomain({
        settingsOcpDomain: "",
        sipAccountDomain: "pbx.example",
      }),
    ).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { deriveOcpModuleEditShell } from "./deriveOcpModuleEditShell.js";

describe("deriveOcpModuleEditShell", () => {
  it("disables config edit before account session", () => {
    expect(
      deriveOcpModuleEditShell({
        hasActiveAccountSession: false,
      }),
    ).toEqual({
      configEditable: false,
      openAccountForRecoveryVisible: false,
    });
  });

  it("allows config edit after account session and never shows Account recovery CTA", () => {
    expect(
      deriveOcpModuleEditShell({
        hasActiveAccountSession: true,
      }),
    ).toEqual({
      configEditable: true,
      openAccountForRecoveryVisible: false,
    });
  });
});

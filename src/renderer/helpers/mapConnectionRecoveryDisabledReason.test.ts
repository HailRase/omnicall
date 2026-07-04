import { describe, expect, it } from "vitest";
import type { ConnectionRecoveryReasonKey } from "@application/projections/deriveConnectionRecoveryShell.js";
import { mapConnectionRecoveryDisabledReason } from "./mapConnectionRecoveryDisabledReason.js";
import { setRendererLanguage } from "../i18n/runtime.js";

describe("mapConnectionRecoveryDisabledReason", () => {
  it("returns null for null reason key", () => {
    expect(mapConnectionRecoveryDisabledReason(null)).toBeNull();
  });

  it("resolves localized disabled reason in ru and en", () => {
    const key: ConnectionRecoveryReasonKey =
      "connection.recovery.disabled.autoReconnectInProgress";

    setRendererLanguage("ru");
    expect(mapConnectionRecoveryDisabledReason(key)).toBe(
      "Автоматическое восстановление выполняется",
    );

    setRendererLanguage("en");
    expect(mapConnectionRecoveryDisabledReason(key)).toBe("Automatic recovery in progress");

    setRendererLanguage("ru");
  });
});

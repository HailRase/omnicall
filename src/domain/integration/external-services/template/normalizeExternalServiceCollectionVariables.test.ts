import { describe, expect, it } from "vitest";
import {
  hasBlockingExternalServiceCollectionVariableIssues,
  inspectExternalServiceCollectionVariableRows,
  normalizeExternalServiceCollectionVariables,
} from "./normalizeExternalServiceCollectionVariables.js";

describe("normalizeExternalServiceCollectionVariables", () => {
  it("trims keys, drops blank rows, and keeps empty values", () => {
    const result = normalizeExternalServiceCollectionVariables([
      { key: " base_url ", value: "https://crm.example.test" },
      { key: "", value: "" },
      { key: "token", value: "" },
    ]);
    expect(result).toEqual({
      ok: true,
      variables: [
        { key: "base_url", value: "https://crm.example.test" },
        { key: "token", value: "" },
      ],
    });
  });

  it("rejects duplicate keys and valued empty keys", () => {
    expect(
      normalizeExternalServiceCollectionVariables([
        { key: "token", value: "a" },
        { key: "token", value: "b" },
      ]),
    ).toEqual({ ok: false, error: "duplicate_variable_key" });

    expect(
      normalizeExternalServiceCollectionVariables([{ key: "  ", value: "secret" }]),
    ).toEqual({ ok: false, error: "empty_variable_key" });
  });

  it("inspects live row issues including system-name warnings", () => {
    const inspections = inspectExternalServiceCollectionVariableRows([
      { key: "", value: "x" },
      { key: "call_id", value: "spoof" },
      { key: "base_url", value: "https://a.test" },
      { key: "base_url", value: "https://b.test" },
    ]);
    expect(inspections).toEqual([
      { index: 0, issues: ["empty_key"] },
      { index: 1, issues: ["system_name"] },
      { index: 2, issues: ["duplicate_key"] },
      { index: 3, issues: ["duplicate_key"] },
    ]);
    expect(hasBlockingExternalServiceCollectionVariableIssues(inspections)).toBe(true);
  });
});

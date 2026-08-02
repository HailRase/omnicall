import { describe, expect, it } from "vitest";
import {
  EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES,
  type ExternalServiceAutomaticEventType,
} from "../ExternalServiceEventType.js";
import {
  EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS,
  listExternalServiceVariableCatalogByGroup,
} from "./ExternalServiceVariableCatalog.js";
import {
  listExternalServiceCatalogEntriesForEvent,
  resolveExternalServiceEventVariableGroups,
} from "./resolveExternalServiceEventVariableGroups.js";

const EXPECTED_GROUPS: Readonly<
  Record<ExternalServiceAutomaticEventType | "manual_run", ReadonlyArray<string>>
> = {
  incoming_ringing: ["always", "call"],
  outgoing_connecting: ["always", "call"],
  call_answered: ["always", "call"],
  call_ended: ["always", "call"],
  call_rejected: ["always", "call"],
  call_missed: ["always", "call"],
  campaign_offered: ["always", "campaign"],
  campaign_accepted: ["always", "campaign"],
  campaign_rejected: ["always", "campaign"],
  acd_context_appeared: ["always", "call", "acd"],
  post_call_processing: ["always"],
  manual_run: ["always", "call"],
};

describe("resolveExternalServiceEventVariableGroups", () => {
  it("covers every automatic event plus manual_run with the Variables-tab matrix", () => {
    for (const eventType of EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES) {
      expect(resolveExternalServiceEventVariableGroups(eventType)).toEqual(
        EXPECTED_GROUPS[eventType],
      );
    }
    expect(resolveExternalServiceEventVariableGroups("manual_run")).toEqual(
      EXPECTED_GROUPS.manual_run,
    );
  });

  it("never invents catalog groups outside the Variables tab", () => {
    const allowed = new Set(EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS);
    for (const eventType of [...EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES, "manual_run"] as const) {
      for (const group of resolveExternalServiceEventVariableGroups(eventType)) {
        expect(allowed.has(group)).toBe(true);
      }
    }
  });

  it("keeps post_call_processing free of call/campaign/acd groups", () => {
    expect(resolveExternalServiceEventVariableGroups("post_call_processing")).toEqual(["always"]);
    const names = listExternalServiceCatalogEntriesForEvent("post_call_processing").map(
      (entry) => entry.name,
    );
    expect(names).toEqual(["timestamp", "event_type", "user_login"]);
    expect(names).not.toContain("call_id");
  });

  it("lists catalog entries that match the resolved groups exactly", () => {
    for (const eventType of EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES) {
      const groups = resolveExternalServiceEventVariableGroups(eventType);
      const expected = groups.flatMap((group) =>
        listExternalServiceVariableCatalogByGroup(group).map((entry) => ({
          name: entry.name,
          group: entry.group,
        })),
      );
      expect(listExternalServiceCatalogEntriesForEvent(eventType)).toEqual(expected);
    }
  });
});

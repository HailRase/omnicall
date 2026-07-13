import { describe, expect, it } from "vitest";

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { parseOcpMessage } from "./parseOcpMessage.js";

describe("parseOcpMessage", () => {
  it("parses creds entity", () => {
    const result = parseOcpMessage({
      entity: "creds",
      payload: {
        username: "user",
        password: "secret",
        domain: "example.com",
        server: "sip.example.com",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        entity: "creds",
        data: {
          username: "user",
          password: "secret",
          domain: "example.com",
          server: "sip.example.com",
        },
      });
    }
  });

  it("normalizes users reason_id null to 0", () => {
    const result = parseOcpMessage({
      entity: "users",
      payload: [
        {
          id: 42,
          status: { value: OperatorStatus.READY, reason_id: null },
          status_time: "2026-07-13T10:00:00.000Z",
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.value.entity === "users") {
      expect(result.value.data.reasonId).toBe(0);
      expect(result.value.data.operatorId).toBe(42);
    }
  });

  it("returns err for unknown entity", () => {
    const result = parseOcpMessage({
      entity: "future_entity",
      payload: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("unknown_entity");
    }
  });

  it("returns err for invalid JSON string", () => {
    const result = parseOcpMessage("{ not-json");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("parse_error");
    }
  });

  it("parses terminate without payload", () => {
    const result = parseOcpMessage({ entity: "terminate" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ entity: "terminate" });
    }
  });

  it("parses Error entity", () => {
    const result = parseOcpMessage({
      entity: "Error",
      payload: { code: "SESSION_EXIST" },
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.value.entity === "Error") {
      expect(result.value.data.code).toBe("SESSION_EXIST");
    }
  });
});

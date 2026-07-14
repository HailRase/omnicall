import { describe, expect, it } from "vitest";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { reduceOcpReasonsFromPayload } from "./ocpReasonsProjection.js";

describe("ocpReasonsProjection", () => {
  it("filters reasons by parentStatus", () => {
    const projection = reduceOcpReasonsFromPayload([
      {
        id: 1,
        parentStatus: OperatorStatus.READY,
        defaultDescription: "Ready",
      },
      {
        id: 7,
        parentStatus: OperatorStatus.BREAK,
        defaultDescription: "Break",
      },
      {
        id: 9,
        parentStatus: OperatorStatus.LOGOUT,
        defaultDescription: "End of shift",
      },
    ]);

    expect(projection.readyReasons).toHaveLength(1);
    expect(projection.breakReasons).toHaveLength(1);
    expect(projection.logoutReasons).toHaveLength(1);
    expect(projection.breakReasons[0]?.id).toBe(7);
  });
});

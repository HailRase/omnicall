import type { PhoneStatus } from "@domain/index.js";

export type DndRejectDecision = Readonly<{
  shouldReject: boolean;
  sipCode: 486 | null;
}>;

export function decideDndIncomingReject(status: PhoneStatus): DndRejectDecision {
  if (status === "dnd") {
    return { shouldReject: true, sipCode: 486 };
  }
  return { shouldReject: false, sipCode: null };
}

/**
 * - Purpose: poll waiting External Services delay jobs while the section is open.
 * - Inputs: facade, section activity, and journal refresh callback.
 * - Outputs: waiting-queue rows and a bump helper after cancel.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { ExternalServicesQueueProps } from "../../components/settings/external-services/ExternalServicesQueue.js";

export type UseExternalServicesPanelQueueResult = Readonly<{
  waitingQueueItems: ExternalServicesQueueProps["items"];
  bumpQueueRefresh: () => void;
}>;

export function useExternalServicesPanelQueue(input: Readonly<{
  facade: AccountBootstrapFacade | null;
  sectionActive: boolean;
  refreshJournal: () => Promise<void>;
}>): UseExternalServicesPanelQueueResult {
  const { facade, sectionActive, refreshJournal } = input;
  const [queueRefresh, setQueueRefresh] = useState(0);
  const waitingCountRef = useRef(0);

  useEffect(() => {
    if (!sectionActive || facade === null) return;
    const timer = window.setInterval(() => {
      const waitingCount = facade.getExternalServicesWaitingJobs().length;
      setQueueRefresh((value) => value + 1);
      if (waitingCount < waitingCountRef.current) {
        window.setTimeout(() => {
          void refreshJournal();
        }, 500);
        window.setTimeout(() => {
          void refreshJournal();
        }, 2000);
      }
      waitingCountRef.current = waitingCount;
    }, 1000);
    return () => window.clearInterval(timer);
  }, [facade, refreshJournal, sectionActive]);

  const waitingQueueItems = useMemo(() => {
    if (facade === null) return [];
    void queueRefresh;
    return facade.getExternalServicesWaitingJobs().map((waiting) => ({
      jobId: waiting.job.jobId,
      collectionName: waiting.job.collectionName,
      requestName: waiting.job.requestName,
      method: waiting.job.request.method,
      eventType: waiting.job.trigger.eventType,
      occurredAt: waiting.job.trigger.occurredAt,
      fireAt: waiting.fireAt,
    }));
  }, [facade, queueRefresh]);

  return {
    waitingQueueItems,
    bumpQueueRefresh: () => {
      setQueueRefresh((value) => value + 1);
    },
  };
}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type PointerEvent as ReactPointerEvent,
} from "react";
import clsx from "clsx";
import { useI18n } from "../../../i18n/index.js";
import { IconControlButton } from "../../icons/IconControlButton.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/index.js";
import {
  ExternalServicesJournal,
  type ExternalServicesJournalProps,
} from "./ExternalServicesJournal.js";
import {
  ExternalServicesRunResult,
  type ExternalServicesRunResultValue,
} from "./ExternalServicesRunResult.js";
import { ExternalServicesQueue, type ExternalServicesQueueProps } from "./ExternalServicesQueue.js";
import styles from "./ExternalServices.module.css";

const DEFAULT_HEIGHT_PX = 280;
const MIN_HEIGHT_PX = 140;
const MAX_HEIGHT_PX = 640;

export type ExternalServicesResponsePaneProps = Readonly<{
  runState: "idle" | "queued" | "running";
  runResult: ExternalServicesRunResultValue | null;
  journal: ExternalServicesJournalProps;
  queue?: ExternalServicesQueueProps | undefined;
}>;

/**
 * - Purpose: Postman-like response/history pane under the request workspace.
 * - Inputs: run state/result and journal panel props.
 * - Outputs: tabbed Response/History with drag resize and collapse toggle.
 * @uiMeta f=F-031
 */
export function ExternalServicesResponsePane({
  runState,
  runResult,
  journal,
  queue,
}: ExternalServicesResponsePaneProps): JSX.Element {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [heightPx, setHeightPx] = useState(DEFAULT_HEIGHT_PX);
  const dragRef = useRef<Readonly<{ startY: number; startHeight: number }> | null>(null);
  const showEmpty = runState === "idle" && runResult === null;
  const toggleIconId = collapsed
    ? "settings.integrations.external-services.panelExpand"
    : "settings.integrations.external-services.panelCollapse";
  const toggleLabel = collapsed
    ? t("icons.settings.integrations.externalServices.panelExpand")
    : t("icons.settings.integrations.externalServices.panelCollapse");

  const onPointerMove = useCallback((event: PointerEvent): void => {
    const drag = dragRef.current;
    if (drag === null) return;
    const delta = drag.startY - event.clientY;
    const next = Math.min(MAX_HEIGHT_PX, Math.max(MIN_HEIGHT_PX, drag.startHeight + delta));
    setHeightPx(next);
  }, []);

  const endDrag = useCallback((): void => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
  }, [onPointerMove]);

  useEffect(() => () => endDrag(), [endDrag]);

  const onResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (collapsed) return;
    event.preventDefault();
    dragRef.current = { startY: event.clientY, startHeight: heightPx };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
  };

  return (
    <section
      className={clsx(styles.responsePane, collapsed && styles.responsePaneCollapsed)}
      style={collapsed ? undefined : { height: `${heightPx}px`, flex: "0 0 auto" }}
      data-testid="external-services-response-pane"
    >
      <div
        className={styles.responseResizeHandle}
        role="separator"
        aria-orientation="horizontal"
        aria-label={t("settings.integrations.externalServices.workspace.resizeResponse")}
        data-testid="external-services-response-resize"
        onPointerDown={onResizePointerDown}
      />
      <Tabs defaultValue="response" className={styles.responseTabs}>
        <div className={styles.responsePaneHeader}>
          <TabsList>
            <TabsTrigger value="response">
              {t("settings.integrations.externalServices.tabs.response")}
            </TabsTrigger>
            <TabsTrigger value="history">
              {t("settings.integrations.externalServices.tabs.history")}
            </TabsTrigger>
            <TabsTrigger value="queue" data-testid="external-services-queue-tab">
              {t("settings.integrations.externalServices.tabs.queue")}
            </TabsTrigger>
          </TabsList>
          <IconControlButton
            iconId={toggleIconId}
            preferAnimated={false}
            ariaLabel={toggleLabel}
            className={styles.responsePaneToggle}
            testId="external-services-response-pane-toggle"
            ariaExpanded={!collapsed}
            onClick={() => {
              setCollapsed((previous) => !previous);
            }}
          />
        </div>
        <TabsContent value="response" className={styles.responseTabContent}>
          {showEmpty ? (
            <div className={styles.responseEmpty} data-testid="external-services-response-empty">
              <p className={styles.responseEmptyText}>
                {t("settings.integrations.externalServices.workspace.responseEmpty")}
              </p>
            </div>
          ) : (
            <ExternalServicesRunResult result={runResult} runState={runState} />
          )}
        </TabsContent>
        <TabsContent value="history" className={styles.responseTabContent}>
          <ExternalServicesJournal {...journal} />
        </TabsContent>
        <TabsContent value="queue" className={styles.responseTabContent}>
          <ExternalServicesQueue items={queue?.items ?? []} onCancel={queue?.onCancel ?? (() => undefined)} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

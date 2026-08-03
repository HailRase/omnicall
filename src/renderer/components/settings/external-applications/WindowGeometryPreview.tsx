/**
 * - Purpose: adaptive desktop preview for External Application window geometry.
 * - Inputs: window size/position, app name, overlays UI, disabled, change callbacks.
 * - Outputs: centered stage; scale fits desktop into available width.
 */

import { useMemo, useRef, type JSX, type ReactNode } from "react";
import { useI18n } from "../../../i18n/index.js";
import { GEOMETRY_PREVIEW_SCALE_DEFAULT } from "./windowGeometryConstants.js";
import { useGeometryPreviewStageWidth } from "./useGeometryPreviewStageWidth.js";
import {
  readDesktopMetrics,
  realToPreview,
  resolveGeometryPreviewScale,
  type DesktopMetrics,
  type WindowGeometryRect,
} from "./windowGeometryMath.js";
import { WindowGeometryPreviewCard } from "./WindowGeometryPreviewCard.js";
import styles from "./WindowGeometryPreview.module.css";

export type WindowGeometryPreviewProps = Readonly<{
  width: number;
  height: number;
  x: number;
  y: number;
  applicationName: string;
  disabled: boolean;
  onGeometryChange: (next: WindowGeometryRect) => void;
  /** Absolute overlay picker rendered on the desktop (top-right). */
  overlaysTrigger?: ReactNode;
  /** Desktop overlay cards; receives the active preview scale. */
  renderOverlayCards?: (scale: number) => ReactNode;
  /** Optional desktop metrics override (tests). */
  desktopMetrics?: DesktopMetrics;
  /** Optional stage width override (tests). */
  stageWidthOverride?: number;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryPreview({
  width,
  height,
  x,
  y,
  applicationName,
  disabled,
  onGeometryChange,
  overlaysTrigger,
  renderOverlayCards,
  desktopMetrics,
  stageWidthOverride,
}: WindowGeometryPreviewProps): JSX.Element {
  const { t } = useI18n();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const measuredStageWidth = useGeometryPreviewStageWidth(stageRef);
  const stageWidth = stageWidthOverride ?? measuredStageWidth;
  const desktop = useMemo(
    () => desktopMetrics ?? readDesktopMetrics(),
    [desktopMetrics],
  );
  const scale = useMemo(() => {
    if (stageWidth <= 0) {
      return GEOMETRY_PREVIEW_SCALE_DEFAULT;
    }
    return resolveGeometryPreviewScale({
      stageContentWidth: stageWidth,
      desktopWidth: desktop.width,
    });
  }, [stageWidth, desktop.width]);

  const cardLabel =
    applicationName.trim().length > 0
      ? applicationName.trim()
      : t("settings.integrations.externalApplications.openMode.preview.appWindow");

  const overlayCards = renderOverlayCards?.(scale) ?? null;

  return (
    <div className={styles.preview} data-testid="external-applications-geometry-preview">
      <div
        ref={stageRef}
        className={styles.stage}
        data-testid="external-applications-geometry-stage"
        data-preview-scale={scale.toFixed(3)}
      >
        <div className={styles.stageCenter}>
          <div
            className={styles.desktop}
            role="group"
            aria-label={t(
              "settings.integrations.externalApplications.windowGeometry.preview.desktop",
            )}
            data-testid="external-applications-geometry-desktop"
            style={{
              width: realToPreview(desktop.width, scale),
              height: realToPreview(desktop.height, scale),
            }}
          >
            <p className={styles.desktopCaption} aria-hidden="true">
              {t("settings.integrations.externalApplications.windowGeometry.preview.desktop")}
            </p>
            <div className={styles.taskbar} aria-hidden="true" />
            <WindowGeometryPreviewCard
              x={x}
              y={y}
              width={width}
              height={height}
              desktop={desktop}
              scale={scale}
              label={cardLabel}
              disabled={disabled}
              onGeometryChange={onGeometryChange}
            />
            {overlayCards ? <div className={styles.overlays}>{overlayCards}</div> : null}
            {overlaysTrigger}
          </div>
        </div>
      </div>
      <p className={styles.hint}>
        {t("settings.integrations.externalApplications.windowGeometry.preview.dragHint")}
      </p>
    </div>
  );
}

/**
 * - Purpose: edge and corner resize hit-targets for the geometry preview card.
 * - Inputs: disabled flag, begin/move/up pointer handlers, localized labels.
 * - Outputs: eight accessible resize controls (n/s/e/w + corners).
 */

import type { JSX, PointerEvent as ReactPointerEvent } from "react";
import { useI18n } from "../../../i18n/index.js";
import {
  RESIZE_HANDLES,
  type ResizeHandle,
} from "./windowGeometryConstants.js";
import styles from "./WindowGeometryPreview.module.css";

const HANDLE_CLASS: Record<ResizeHandle, string> = {
  n: styles.handleN,
  s: styles.handleS,
  e: styles.handleE,
  w: styles.handleW,
  ne: styles.handleNe,
  nw: styles.handleNw,
  se: styles.handleSe,
  sw: styles.handleSw,
};

const HANDLE_LABEL_KEY: Record<
  ResizeHandle,
  | "settings.integrations.externalApplications.windowGeometry.preview.resize.n"
  | "settings.integrations.externalApplications.windowGeometry.preview.resize.s"
  | "settings.integrations.externalApplications.windowGeometry.preview.resize.e"
  | "settings.integrations.externalApplications.windowGeometry.preview.resize.w"
  | "settings.integrations.externalApplications.windowGeometry.preview.resize.ne"
  | "settings.integrations.externalApplications.windowGeometry.preview.resize.nw"
  | "settings.integrations.externalApplications.windowGeometry.preview.resize.se"
  | "settings.integrations.externalApplications.windowGeometry.preview.resize.sw"
> = {
  n: "settings.integrations.externalApplications.windowGeometry.preview.resize.n",
  s: "settings.integrations.externalApplications.windowGeometry.preview.resize.s",
  e: "settings.integrations.externalApplications.windowGeometry.preview.resize.e",
  w: "settings.integrations.externalApplications.windowGeometry.preview.resize.w",
  ne: "settings.integrations.externalApplications.windowGeometry.preview.resize.ne",
  nw: "settings.integrations.externalApplications.windowGeometry.preview.resize.nw",
  se: "settings.integrations.externalApplications.windowGeometry.preview.resize.se",
  sw: "settings.integrations.externalApplications.windowGeometry.preview.resize.sw",
};

export type WindowGeometryResizeHandlesProps = Readonly<{
  disabled: boolean;
  onBegin: (handle: ResizeHandle, event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryResizeHandles({
  disabled,
  onBegin,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: WindowGeometryResizeHandlesProps): JSX.Element {
  const { t } = useI18n();

  return (
    <>
      {RESIZE_HANDLES.map((handle) => (
        <button
          key={handle}
          type="button"
          className={`${styles.handle} ${HANDLE_CLASS[handle]}`}
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
          aria-label={t(HANDLE_LABEL_KEY[handle])}
          data-testid={`external-applications-geometry-resize-${handle}`}
          onPointerDown={(event) => {
            onBegin(handle, event);
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      ))}
    </>
  );
}

/**
 * - Purpose: draggable/resizable primary app card inside the geometry preview.
 * - Inputs: real geometry, desktop metrics, preview scale, labels, commit callback.
 * - Outputs: focusable card; live DOM paint during drag/resize, commit on release.
 */

import {
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
} from "react";
import { applyPreviewCardRect } from "./applyPreviewCardRect.js";
import { KEYBOARD_NUDGE_PX } from "./windowGeometryConstants.js";
import {
  clampPositionInsideDesktop,
  type DesktopMetrics,
  type WindowGeometryRect,
} from "./windowGeometryMath.js";
import { useWindowGeometryCardDrag } from "./useWindowGeometryCardDrag.js";
import { useWindowGeometryCardResize } from "./useWindowGeometryCardResize.js";
import { WindowGeometryResizeHandles } from "./WindowGeometryResizeHandles.js";
import styles from "./WindowGeometryPreview.module.css";

export type WindowGeometryPreviewCardProps = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  desktop: DesktopMetrics;
  scale: number;
  label: string;
  disabled: boolean;
  onGeometryChange: (next: WindowGeometryRect) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryPreviewCard({
  x,
  y,
  width,
  height,
  desktop,
  scale,
  label,
  disabled,
  onGeometryChange,
}: WindowGeometryPreviewCardProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const interactingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  useLayoutEffect(() => {
    if (interactingRef.current) {
      return;
    }
    const element = cardRef.current;
    if (element !== null) {
      applyPreviewCardRect(element, { x, y, width, height }, scale);
    }
  }, [x, y, width, height, scale]);

  const drag = useWindowGeometryCardDrag({
    disabled,
    cardRef,
    x,
    y,
    width,
    height,
    desktop,
    scale,
    onCommit: onGeometryChange,
    onInteractionChange: (active) => {
      interactingRef.current = active;
      setDragging(active);
    },
  });
  const resize = useWindowGeometryCardResize({
    disabled,
    cardRef,
    x,
    y,
    width,
    height,
    desktop,
    scale,
    onCommit: onGeometryChange,
    onInteractionChange: (active) => {
      interactingRef.current = active;
      setResizing(active);
    },
  });

  function nudge(dx: number, dy: number): void {
    const next = clampPositionInsideDesktop(x + dx, y + dy, width, height, desktop);
    onGeometryChange({ ...next, width, height });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (disabled) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudge(-KEYBOARD_NUDGE_PX, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nudge(KEYBOARD_NUDGE_PX, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      nudge(0, -KEYBOARD_NUDGE_PX);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      nudge(0, KEYBOARD_NUDGE_PX);
    }
  }

  return (
    <div
      ref={cardRef}
      className={styles.card}
      role="group"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      data-testid="external-applications-geometry-card"
      data-dragging={dragging ? "true" : "false"}
      data-resizing={resizing ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        if (resize.isResizing()) {
          return;
        }
        drag.onPointerDown(event);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <div className={styles.cardTitlebar} aria-hidden="true">
        <span className={styles.cardDot} />
        <span className={styles.cardDot} />
        <span className={styles.cardDot} />
        <span className={styles.cardLabel}>{label}</span>
      </div>
      <div className={styles.cardBody} aria-hidden="true" />
      <WindowGeometryResizeHandles
        disabled={disabled}
        onBegin={(handle, event) => {
          resize.beginResize(handle, event);
        }}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
        onPointerCancel={resize.onPointerCancel}
      />
    </div>
  );
}

/**
 * - Purpose: live edge/corner resize (DOM paint, commit on release).
 * - Inputs: card element, origin rect, desktop metrics, commit callback.
 * - Outputs: pointer handlers; parent state updates only on pointer up.
 */

import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { applyPreviewCardRect } from "./applyPreviewCardRect.js";
import type { ResizeHandle } from "./windowGeometryConstants.js";
import {
  geometryFromPreviewResize,
  type DesktopMetrics,
  type WindowGeometryRect,
} from "./windowGeometryMath.js";

type ResizeState = Readonly<{
  pointerId: number | null;
  handle: ResizeHandle;
  startClientX: number;
  startClientY: number;
  origin: WindowGeometryRect;
}>;

export type UseWindowGeometryCardResizeInput = Readonly<{
  disabled: boolean;
  cardRef: RefObject<HTMLDivElement | null>;
  x: number;
  y: number;
  width: number;
  height: number;
  desktop: DesktopMetrics;
  scale: number;
  onCommit: (next: WindowGeometryRect) => void;
  onInteractionChange?: (active: boolean) => void;
}>;

export type UseWindowGeometryCardResizeResult = Readonly<{
  beginResize: (
    handle: ResizeHandle,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  isResizing: () => boolean;
}>;

function rectEquals(a: WindowGeometryRect, b: WindowGeometryRect): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

function samePointer(
  resize: ResizeState,
  event: ReactPointerEvent<HTMLElement>,
): boolean {
  return (
    event.pointerId == null ||
    resize.pointerId == null ||
    resize.pointerId === event.pointerId
  );
}

export function useWindowGeometryCardResize(
  input: UseWindowGeometryCardResizeInput,
): UseWindowGeometryCardResizeResult {
  const resizeRef = useRef<ResizeState | null>(null);
  const pendingRef = useRef<WindowGeometryRect | null>(null);
  const latest = useRef(input);
  latest.current = input;

  function paint(rect: WindowGeometryRect): void {
    const element = latest.current.cardRef.current;
    if (element !== null) {
      applyPreviewCardRect(element, rect, latest.current.scale);
    }
  }

  function release(
    event: ReactPointerEvent<HTMLElement>,
    commit: boolean,
  ): void {
    const resize = resizeRef.current;
    const pending = pendingRef.current;
    resizeRef.current = null;
    pendingRef.current = null;
    latest.current.onInteractionChange?.(false);
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      typeof event.currentTarget.releasePointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (resize === null) {
      return;
    }
    if (commit && pending !== null && !rectEquals(pending, resize.origin)) {
      latest.current.onCommit(pending);
      return;
    }
    paint(resize.origin);
  }

  return {
    beginResize(handle, event) {
      if (latest.current.disabled) {
        return;
      }
      if (event.button != null && event.button !== 0) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      const state = latest.current;
      const origin = {
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
      };
      resizeRef.current = {
        pointerId: event.pointerId ?? null,
        handle,
        startClientX: event.clientX,
        startClientY: event.clientY,
        origin,
      };
      pendingRef.current = origin;
      latest.current.onInteractionChange?.(true);
    },
    onPointerMove(event) {
      const resize = resizeRef.current;
      if (resize === null || !samePointer(resize, event)) {
        return;
      }
      const deltaX = event.clientX - resize.startClientX;
      const deltaY = event.clientY - resize.startClientY;
      if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
        return;
      }
      const next = geometryFromPreviewResize(
        resize.handle,
        resize.origin,
        deltaX,
        deltaY,
        latest.current.desktop,
        latest.current.scale,
      );
      pendingRef.current = next;
      paint(next);
    },
    onPointerUp(event) {
      release(event, true);
    },
    onPointerCancel(event) {
      release(event, false);
    },
    isResizing: () => resizeRef.current !== null,
  };
}

/**
 * - Purpose: live drag for the geometry preview card (DOM paint, commit on release).
 * - Inputs: card element, geometry, desktop metrics, commit callback.
 * - Outputs: pointer handlers; parent state updates only on pointer up.
 */

import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { applyPreviewCardRect } from "./applyPreviewCardRect.js";
import {
  positionFromPreviewDrag,
  type DesktopMetrics,
  type WindowGeometryRect,
} from "./windowGeometryMath.js";

type DragState = Readonly<{
  pointerId: number | null;
  startClientX: number;
  startClientY: number;
  origin: WindowGeometryRect;
}>;

export type UseWindowGeometryCardDragInput = Readonly<{
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

export type UseWindowGeometryCardDragResult = Readonly<{
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
}>;

function rectEquals(a: WindowGeometryRect, b: WindowGeometryRect): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

function samePointer(drag: DragState, event: ReactPointerEvent<HTMLElement>): boolean {
  return event.pointerId == null || drag.pointerId == null || drag.pointerId === event.pointerId;
}

export function useWindowGeometryCardDrag(
  input: UseWindowGeometryCardDragInput,
): UseWindowGeometryCardDragResult {
  const dragRef = useRef<DragState | null>(null);
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
    event: ReactPointerEvent<HTMLDivElement>,
    commit: boolean,
  ): void {
    const drag = dragRef.current;
    const pending = pendingRef.current;
    dragRef.current = null;
    pendingRef.current = null;
    latest.current.onInteractionChange?.(false);
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      typeof event.currentTarget.releasePointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag === null) {
      return;
    }
    if (commit && pending !== null && !rectEquals(pending, drag.origin)) {
      latest.current.onCommit(pending);
      return;
    }
    paint(drag.origin);
  }

  return {
    onPointerDown(event) {
      if (latest.current.disabled) {
        return;
      }
      if (event.button != null && event.button !== 0) {
        return;
      }
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
      dragRef.current = {
        pointerId: event.pointerId ?? null,
        startClientX: event.clientX,
        startClientY: event.clientY,
        origin,
      };
      pendingRef.current = origin;
      latest.current.onInteractionChange?.(true);
    },
    onPointerMove(event) {
      const drag = dragRef.current;
      const state = latest.current;
      if (drag === null || !samePointer(drag, event)) {
        return;
      }
      const deltaX = event.clientX - drag.startClientX;
      const deltaY = event.clientY - drag.startClientY;
      if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
        return;
      }
      const position = positionFromPreviewDrag(
        drag.origin.x,
        drag.origin.y,
        deltaX,
        deltaY,
        drag.origin.width,
        drag.origin.height,
        state.desktop,
        state.scale,
      );
      const next = {
        ...drag.origin,
        x: position.x,
        y: position.y,
      };
      pendingRef.current = next;
      paint(next);
    },
    onPointerUp(event) {
      release(event, true);
    },
    onPointerCancel(event) {
      release(event, false);
    },
  };
}

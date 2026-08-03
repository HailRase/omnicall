/**
 * - Purpose: observe stage element content width for adaptive preview scale.
 * - Inputs: element ref to the stage container.
 * - Outputs: content-box width (clientWidth minus horizontal padding).
 */

import { useLayoutEffect, useState, type RefObject } from "react";

function readContentWidth(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
  return Math.max(0, element.clientWidth - paddingLeft - paddingRight);
}

export function useGeometryPreviewStageWidth(
  stageRef: RefObject<HTMLElement | null>,
): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (element === null) {
      return;
    }

    const update = (): void => {
      const next = readContentWidth(element);
      setWidth((previous) => (previous === next ? previous : next));
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => {
        window.removeEventListener("resize", update);
      };
    }

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [stageRef]);

  return width;
}

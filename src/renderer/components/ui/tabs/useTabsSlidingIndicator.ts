import { useLayoutEffect, useState, type RefObject } from "react";

export type TabsSlidingIndicatorRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  ready: boolean;
}>;

const EMPTY_RECT: TabsSlidingIndicatorRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  ready: false,
};

/**
 * - Purpose: measure the active Tabs trigger for a sliding selected indicator.
 * - Inputs: list element ref and enabled flag.
 * - Outputs: indicator geometry relative to the list content box.
 */
export function useTabsSlidingIndicator(
  listRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): TabsSlidingIndicatorRect {
  const [rect, setRect] = useState<TabsSlidingIndicatorRect>(EMPTY_RECT);

  useLayoutEffect(() => {
    if (!enabled) {
      setRect(EMPTY_RECT);
      return;
    }

    const listNode = listRef.current;
    if (listNode === null) {
      return;
    }
    const list: HTMLElement = listNode;

    function measure(): void {
      const activeTab = list.querySelector<HTMLElement>(
        '[role="tab"][data-state="active"]',
      );
      if (activeTab === null) {
        setRect(EMPTY_RECT);
        return;
      }

      const listBox = list.getBoundingClientRect();
      const tabBox = activeTab.getBoundingClientRect();
      setRect({
        x: tabBox.left - listBox.left + list.scrollLeft,
        y: tabBox.top - listBox.top + list.scrollTop,
        width: tabBox.width,
        height: tabBox.height,
        ready: tabBox.width > 0 && tabBox.height > 0,
      });
    }

    measure();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            measure();
          });
    if (resizeObserver !== null) {
      resizeObserver.observe(list);
      for (const tab of list.querySelectorAll('[role="tab"]')) {
        resizeObserver.observe(tab);
      }
    }

    const mutationObserver = new MutationObserver(() => {
      measure();
      if (resizeObserver !== null) {
        for (const tab of list.querySelectorAll('[role="tab"]')) {
          resizeObserver.observe(tab);
        }
      }
    });
    mutationObserver.observe(list, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["data-state"],
    });

    list.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      list.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [enabled, listRef]);

  return rect;
}

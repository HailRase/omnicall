import { useCallback, useMemo, useState, type FocusEvent, type HTMLAttributes } from "react";

const HOVER_CAPABLE_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";

function isHoverCapableEnvironment(): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(HOVER_CAPABLE_MEDIA_QUERY).matches;
}

export type ListRowActionRevealBindings = Readonly<{
  isActionVisible: boolean;
  rowInteractionProps: Pick<
    HTMLAttributes<HTMLElement>,
    "onMouseEnter" | "onMouseLeave" | "onFocusCapture" | "onBlurCapture"
  >;
}>;

/**
 * - Purpose: reveal list-row quick actions on hover or keyboard focus for pointer-fine devices.
 * - Inputs: none; reads hover-capable media query once per mount.
 * - Outputs: visibility flag and row interaction handlers for action reveal.
 */
export function useListRowActionReveal(): ListRowActionRevealBindings {
  const hoverCapable = useMemo(() => isHoverCapableEnvironment(), []);
  const [isInteracting, setIsInteracting] = useState(false);

  const handleBlurCapture = useCallback((event: FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setIsInteracting(false);
  }, []);

  return {
    isActionVisible: !hoverCapable || isInteracting,
    rowInteractionProps: {
      onMouseEnter: () => {
        setIsInteracting(true);
      },
      onMouseLeave: () => {
        setIsInteracting(false);
      },
      onFocusCapture: () => {
        setIsInteracting(true);
      },
      onBlurCapture: handleBlurCapture,
    },
  };
}

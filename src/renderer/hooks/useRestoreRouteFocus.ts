import { useEffect } from "react";

type UseRestoreRouteFocusInput = Readonly<{
  targetTestId: string | null;
  onHandled?: () => void;
}>;

/**
 * - Purpose: move keyboard focus to a route element after back navigation.
 * - Inputs: data-testid of the focus target and optional handled callback.
 * - Outputs: side effect that focuses the element once when the target is present.
 */
export function useRestoreRouteFocus({
  targetTestId,
  onHandled,
}: UseRestoreRouteFocusInput): void {
  useEffect(() => {
    if (targetTestId === null) {
      return;
    }

    const element = document.querySelector<HTMLElement>(`[data-testid="${targetTestId}"]`);
    if (element === null) {
      return;
    }

    element.focus();
    onHandled?.();
  }, [onHandled, targetTestId]);
}

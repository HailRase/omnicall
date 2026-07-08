import { useCallback, useRef, type RefObject } from "react";

export type UseDialogReturnFocusResult<T extends HTMLElement> = Readonly<{
  triggerRef: RefObject<T | null>;
  onCloseAutoFocus: (event: Event) => void;
}>;

/**
 * - Purpose: restore keyboard focus to the dialog trigger after Radix close.
 * - Inputs: none; caller attaches triggerRef to the opening control.
 * - Outputs: trigger ref and onCloseAutoFocus handler for AlertDialogContent.
 */
export function useDialogReturnFocus<T extends HTMLElement>(): UseDialogReturnFocusResult<T> {
  const triggerRef = useRef<T>(null);

  const onCloseAutoFocus = useCallback((event: Event): void => {
    event.preventDefault();
    triggerRef.current?.focus();
  }, []);

  return { triggerRef, onCloseAutoFocus };
}

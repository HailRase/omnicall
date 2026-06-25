import { useCallback } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { PhoneStatus } from "@application/index.js";

type UsePhoneStatusActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  disabled: boolean;
}>;

type UsePhoneStatusActionsResult = Readonly<{
  handlePhoneStatusChange: (nextStatus: PhoneStatus) => void;
}>;

/**
 * - Purpose: bind phone status badge UI to facade setPhoneStatus.
 * - Inputs: facade and disabled flag from auth shell.
 * - Outputs: phone status change callback.
 */
export function usePhoneStatusActions(
  input: UsePhoneStatusActionsInput,
): UsePhoneStatusActionsResult {
  const { facade, disabled } = input;

  const handlePhoneStatusChange = useCallback(
    (nextStatus: PhoneStatus): void => {
      if (facade === null || disabled) {
        return;
      }
      void facade.setPhoneStatus(nextStatus);
    },
    [disabled, facade],
  );

  return { handlePhoneStatusChange };
}

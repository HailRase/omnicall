/**
 * - Purpose: map geometry number-field validation results to FormField error text.
 * - Inputs: i18n `t` and validation callbacks from the number field.
 * - Outputs: localized error string or undefined when valid.
 */

import { useState } from "react";
import type { GeometryNumberValidation } from "./WindowGeometryNumberField.js";

type GeometryValidationTranslate = {
  (
    key: "settings.integrations.externalApplications.windowGeometry.validation.invalidNumber",
  ): string;
  (
    key: "settings.integrations.externalApplications.windowGeometry.validation.outOfRange",
    params: Readonly<{ min: number; max: number }>,
  ): string;
};

export function useGeometryFieldValidation(t: GeometryValidationTranslate): Readonly<{
  error: string | undefined;
  onValidationChange: (result: GeometryNumberValidation) => void;
}> {
  const [error, setError] = useState<string | undefined>(undefined);

  return {
    error,
    onValidationChange(result) {
      if (result.kind === "ok") {
        setError(undefined);
        return;
      }
      if (result.kind === "invalid_number") {
        setError(
          t(
            "settings.integrations.externalApplications.windowGeometry.validation.invalidNumber",
          ),
        );
        return;
      }
      setError(
        t(
          "settings.integrations.externalApplications.windowGeometry.validation.outOfRange",
          { min: result.min, max: result.max },
        ),
      );
    },
  };
}

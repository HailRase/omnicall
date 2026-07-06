import clsx from "clsx";
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type HTMLAttributes,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Label } from "../label/Label.js";
import styles from "./FormField.module.css";

type FormFieldControlProps = {
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "false" | "grammar" | "spelling" | "true";
};

export type FormFieldProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    children: ReactElement<FormFieldControlProps>;
  }
>;

function mergeDescribedBy(
  existing: string | undefined,
  ids: readonly string[],
): string | undefined {
  const parts = [...(existing?.split(/\s+/).filter(Boolean) ?? []), ...ids];
  const unique = [...new Set(parts)];
  return unique.length > 0 ? unique.join(" ") : undefined;
}

function isRenderableMessage(value: ReactNode): boolean {
  return value != null && value !== false && value !== "";
}

/**
 * - Purpose: composes label, control, hint, and error with shared accessible ids.
 * - Inputs: label, hint, error, required, disabled, single control child.
 * - Outputs: field layout with wired label, descriptions, and invalid state.
 */
export const FormField = forwardRef(function FormField(
  {
    label,
    hint,
    error,
    required = false,
    disabled = false,
    className,
    children,
    ...rest
  }: FormFieldProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const baseId = useId();
  const controlId = `${baseId}-control`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  const showError = isRenderableMessage(error);
  const showHint = isRenderableMessage(hint) && !showError;

  const child = Children.only(children);
  if (!isValidElement<FormFieldControlProps>(child)) {
    throw new Error("FormField children must be a single React element.");
  }

  const descriptionIds: string[] = [];
  if (showHint) {
    descriptionIds.push(hintId);
  }
  if (showError) {
    descriptionIds.push(errorId);
  }

  const describedBy = mergeDescribedBy(child.props["aria-describedby"], descriptionIds);
  const controlDisabled = disabled || child.props.disabled === true;

  const control = cloneElement(child, {
    ...child.props,
    id: controlId,
    disabled: controlDisabled,
    ...(describedBy != null ? { "aria-describedby": describedBy } : {}),
    ...(showError
      ? {
          "aria-invalid": true as const,
          invalid: true,
        }
      : {}),
  });

  return (
    <div
      ref={ref}
      className={clsx(styles.field, className)}
      {...rest}
      data-disabled={disabled ? "true" : undefined}
      data-invalid={showError ? "true" : undefined}
      data-required={required ? "true" : undefined}
    >
      {isRenderableMessage(label) ? (
        <Label htmlFor={controlId} required={required} disabled={disabled}>
          {label}
        </Label>
      ) : null}
      {control}
      {showHint ? (
        <p id={hintId} className={clsx(styles.message, styles.hint)}>
          {hint}
        </p>
      ) : null}
      {showError ? (
        <p id={errorId} className={clsx(styles.message, styles.error)} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

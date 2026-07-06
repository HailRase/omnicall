import clsx from "clsx";
import type { ComponentProps, JSX } from "react";
import { Toaster as SonnerToaster } from "sonner";
import "sonner/dist/styles.css";
import { useDocumentTheme } from "../../../theme/useDocumentTheme.js";
import styles from "./Sonner.module.css";

export type ToasterProps = Readonly<ComponentProps<typeof SonnerToaster>>;

const DEFAULT_TOAST_CLASS_NAMES = {
  toast: styles.toast,
  default: styles.toastDefault,
  success: styles.toastSuccess,
  info: styles.toastInfo,
  warning: styles.toastWarning,
  error: styles.toastError,
  title: styles.title,
  description: styles.description,
  actionButton: styles.actionButton,
  cancelButton: styles.cancelButton,
  closeButton: styles.closeButton,
} as const;

/**
 * - Purpose: shadcn-compatible Sonner toaster wired to project semantic tokens.
 * - Inputs: Sonner Toaster props including position, theme, richColors, and toastOptions.
 * - Outputs: fixed toast viewport with stacked Sonner surfaces and dismiss controls.
 */
export function Toaster({
  theme,
  className,
  toastOptions,
  ...rest
}: ToasterProps): JSX.Element {
  const documentTheme = useDocumentTheme();
  const resolvedTheme = theme ?? documentTheme;

  return (
    <SonnerToaster
      {...rest}
      theme={resolvedTheme}
      className={clsx(styles.toaster, className)}
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        classNames: {
          ...DEFAULT_TOAST_CLASS_NAMES,
          ...toastOptions?.classNames,
        },
      }}
    />
  );
}

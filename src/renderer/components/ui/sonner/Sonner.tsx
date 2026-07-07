import clsx from "clsx";
import type { ComponentProps, JSX } from "react";
import { Toaster as SonnerToaster } from "sonner";
import "sonner/dist/styles.css";
import { useDocumentTheme } from "../../../theme/useDocumentTheme.js";
import styles from "./Sonner.module.css";

export type ToasterProps = Readonly<ComponentProps<typeof SonnerToaster>>;

/**
 * - Purpose: bridge Sonner toaster theme variables to project semantic tokens.
 * - Inputs: native Sonner Toaster props and optional explicit theme override.
 * - Outputs: Sonner viewport with token-driven light/dark surfaces and native stack behavior.
 */
export function Toaster({
  theme,
  className,
  ...rest
}: ToasterProps): JSX.Element {
  const documentTheme = useDocumentTheme();
  const resolvedTheme = theme ?? documentTheme;

  return (
    <SonnerToaster
      {...rest}
      theme={resolvedTheme}
      className={clsx(styles.toaster, className)}
    />
  );
}

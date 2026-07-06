import clsx from "clsx";
import {
  forwardRef,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import { IconButton } from "../icon-button/IconButton.js";
import type { NotificationTone } from "../types.js";
import styles from "./Notification.module.css";

export type NotificationProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "className" | "children" | "title"> & {
    tone?: NotificationTone;
    title: ReactNode;
    message?: ReactNode;
    actions?: ReactNode;
    metadata?: ReactNode;
    closable?: boolean;
    closeLabel?: string;
    onClose?: () => void;
    className?: string;
  }
>;

const TONE_CLASS: Record<NotificationTone, string> = {
  default: styles.toneDefault ?? "",
  success: styles.toneSuccess ?? "",
  warning: styles.toneWarning ?? "",
  destructive: styles.toneDestructive ?? "",
  info: styles.toneInfo ?? "",
};

function resolveRole(tone: NotificationTone): "alert" | "status" {
  return tone === "destructive" ? "alert" : "status";
}

function resolveAriaLive(tone: NotificationTone): "assertive" | "polite" {
  return tone === "destructive" ? "assertive" : "polite";
}

/**
 * - Purpose: persistent notification card with tone, copy slots, actions, and optional close.
 * - Inputs: tone, title, message, actions, metadata, closable, closeLabel, onClose, and native article props.
 * - Outputs: accessible notification surface for product notification containers.
 */
export const Notification = forwardRef(function Notification(
  {
    tone = "default",
    title,
    message,
    actions,
    metadata,
    closable = false,
    closeLabel,
    onClose,
    className,
    ...rest
  }: NotificationProps,
  ref: Ref<HTMLElement>,
): JSX.Element {
  const showClose =
    closable && closeLabel !== undefined && closeLabel.length > 0;

  return (
    <article
      ref={ref}
      {...rest}
      role={resolveRole(tone)}
      aria-live={resolveAriaLive(tone)}
      className={clsx(
        styles.root,
        TONE_CLASS[tone],
        closable && styles.closable,
        className,
      )}
      data-tone={tone}
    >
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {message !== undefined && message !== null ? (
          <p className={styles.message}>{message}</p>
        ) : null}
        {metadata !== undefined && metadata !== null ? (
          <div className={styles.metadata}>{metadata}</div>
        ) : null}
        {actions !== undefined && actions !== null ? (
          <div className={styles.actions}>{actions}</div>
        ) : null}
      </div>
      {showClose ? (
        <IconButton
          iconId="overlay.close"
          ariaLabel={closeLabel}
          variant="ghost"
          size="sm"
          className={styles.closeButton}
          onClick={onClose}
        />
      ) : null}
    </article>
  );
});

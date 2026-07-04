import type { JSX } from "react";
import styles from "./SettingsPlaceholderPanel.module.css";

export type SettingsPlaceholderPanelProps = Readonly<{
  title: string;
  description: string;
  testId: string;
}>;

/**
 * - Purpose: render planned-settings section placeholder copy.
 * - Inputs: section title, description, test id.
 * - Outputs: accessible placeholder panel without business logic.
 */
export function SettingsPlaceholderPanel({
  title,
  description,
  testId,
}: SettingsPlaceholderPanelProps): JSX.Element {
  return (
    <section className={styles.panel} data-testid={testId} aria-label={title}>
      <p className={styles.description}>{description}</p>
    </section>
  );
}

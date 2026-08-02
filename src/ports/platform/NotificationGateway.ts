import type { UserNotificationModule } from "@domain/settings/UserNotificationJournalEntry.js";

export type OsNotificationUrgency = "normal" | "important";

export type OsNotificationRequest = Readonly<{
  id: string;
  title: string;
  body: string;
  module: UserNotificationModule;
  correlationId: string | null;
  urgency: OsNotificationUrgency;
}>;

export type OsNotificationDismissRequest = Readonly<{
  id: string;
}>;

/**
 * - Purpose: OS/tray notification seam for unfocused shell attention (F-034 WU-09).
 * - Inputs: sanitized title/body request after capture policy allows OS channel.
 * - Outputs: present/dismiss acknowledgements; click→focus remains adapter-owned.
 */
export interface NotificationGateway {
  present(request: OsNotificationRequest): Promise<void>;
  dismiss(request: OsNotificationDismissRequest): Promise<void>;
}

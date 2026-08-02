import type {
  NotificationGateway,
  OsNotificationDismissRequest,
  OsNotificationRequest,
} from "@ports/platform/NotificationGateway.js";

/**
 * - Purpose: in-memory NotificationGateway for tests; no OS banners.
 * - Inputs: present/dismiss requests.
 * - Outputs: recorded call history for assertions.
 */
export class MockNotificationGateway implements NotificationGateway {
  readonly presented: OsNotificationRequest[] = [];
  readonly dismissed: OsNotificationDismissRequest[] = [];

  present(request: OsNotificationRequest): Promise<void> {
    this.presented.push(request);
    return Promise.resolve();
  }

  dismiss(request: OsNotificationDismissRequest): Promise<void> {
    this.dismissed.push(request);
    return Promise.resolve();
  }
}

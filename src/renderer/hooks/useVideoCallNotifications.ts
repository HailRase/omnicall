import { useEffect } from "react";
import type { DomainEventPublisher } from "@ports/index.js";
import type { NotificationDescriptor, UseNotificationsResult } from "./useNotifications.js";

type NotificationApi = Pick<UseNotificationsResult, "notify">;

type UseVideoCallNotificationsInput = Readonly<{
  eventPublisher: DomainEventPublisher | null;
  notifications: NotificationApi;
}>;

/**
 * - Purpose: surface video-call domain outcomes as renderer toast notifications.
 * - Inputs: domain event publisher and notification enqueue API.
 * - Outputs: side effects for remote audio-only downgrade and related video events.
 */
export function useVideoCallNotifications(input: UseVideoCallNotificationsInput): void {
  const { eventPublisher, notifications } = input;
  const { notify } = notifications;

  useEffect(() => {
    if (eventPublisher === null) {
      return;
    }

    return eventPublisher.subscribe((event) => {
      if (event.type !== "CallDowngradedToAudioOnly") {
        return;
      }
      const reason = event["reason"];
      if (reason !== "remote_audio_only") {
        return;
      }

      const descriptor: NotificationDescriptor = {
        id: `video-downgrade-${String(event["callId"])}`,
        level: "error",
        messageKey: "notification.video.remoteAudioOnly",
      };
      notify(descriptor);
    });
  }, [eventPublisher, notify]);
}

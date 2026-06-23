export type PhoneStatus = "online" | "offline" | "dnd";

export const PHONE_STATUSES: ReadonlyArray<PhoneStatus> = [
  "online",
  "offline",
  "dnd",
];

export function isPhoneStatus(value: string): value is PhoneStatus {
  return PHONE_STATUSES.includes(value as PhoneStatus);
}

export function phoneStatusLabel(status: PhoneStatus): string {
  switch (status) {
    case "online":
      return "Online";
    case "offline":
      return "Offline";
    case "dnd":
      return "DND";
  }
}

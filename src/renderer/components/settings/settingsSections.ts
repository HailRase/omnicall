import type { IconSemanticId } from "../icons/iconCatalog.js";

export type SettingsSectionId =
  | "account"
  | "general"
  | "sessions"
  | "diagnostics"
  | "codecs"
  | "headset";

export type SettingsNavItem = Readonly<{
  id: SettingsSectionId;
  label: string;
  iconId: IconSemanticId;
  testId: string;
}>;

export const SETTINGS_NAV_ITEMS: ReadonlyArray<SettingsNavItem> = [
  {
    id: "account",
    label: "Аккаунт",
    iconId: "settings.account",
    testId: "settings-nav-account",
  },
  {
    id: "general",
    label: "Общее",
    iconId: "settings.general",
    testId: "settings-nav-general",
  },
  {
    id: "sessions",
    label: "Сессии",
    iconId: "settings.sessions",
    testId: "settings-nav-sessions",
  },
  {
    id: "diagnostics",
    label: "Диагностика",
    iconId: "shell.diagnostics",
    testId: "settings-nav-diagnostics",
  },
  {
    id: "codecs",
    label: "Кодеки",
    iconId: "settings.codecs",
    testId: "settings-nav-codecs",
  },
  {
    id: "headset",
    label: "Гарнитура",
    iconId: "settings.headset",
    testId: "settings-nav-headset",
  },
];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "general";

const SETTINGS_SECTION_IDS: ReadonlyArray<SettingsSectionId> = SETTINGS_NAV_ITEMS.map(
  (entry) => entry.id,
);

export function isSettingsSectionId(value: unknown): value is SettingsSectionId {
  return typeof value === "string" && SETTINGS_SECTION_IDS.includes(value as SettingsSectionId);
}

export function resolveSettingsSectionTitle(sectionId: SettingsSectionId): string {
  const item = SETTINGS_NAV_ITEMS.find((entry) => entry.id === sectionId);
  return item?.label ?? "Настройки";
}

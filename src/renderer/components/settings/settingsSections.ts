import type { IconSemanticId } from "../icons/iconCatalog.js";
import type { TranslationKey, Translator } from "../../i18n/index.js";

export type SettingsSectionId =
  | "account"
  | "general"
  | "sessions"
  | "system-state"
  | "diagnostics"
  | "codecs"
  | "headset";

export type SettingsNavItem = Readonly<{
  id: SettingsSectionId;
  labelKey: TranslationKey;
  iconId: IconSemanticId;
  testId: string;
}>;

export const SETTINGS_NAV_ITEMS: ReadonlyArray<SettingsNavItem> = [
  {
    id: "account",
    labelKey: "settings.nav.account",
    iconId: "settings.account",
    testId: "settings-nav-account",
  },
  {
    id: "general",
    labelKey: "settings.nav.general",
    iconId: "settings.general",
    testId: "settings-nav-general",
  },
  {
    id: "sessions",
    labelKey: "settings.nav.sessions",
    iconId: "settings.sessions",
    testId: "settings-nav-sessions",
  },
  {
    id: "system-state",
    labelKey: "settings.nav.systemState",
    iconId: "settings.system-state",
    testId: "settings-nav-system-state",
  },
  {
    id: "diagnostics",
    labelKey: "settings.nav.diagnostics",
    iconId: "shell.diagnostics",
    testId: "settings-nav-diagnostics",
  },
  {
    id: "codecs",
    labelKey: "settings.nav.codecs",
    iconId: "settings.codecs",
    testId: "settings-nav-codecs",
  },
  {
    id: "headset",
    labelKey: "settings.nav.headset",
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

export function resolveSettingsSectionTitle(
  t: Translator,
  sectionId: SettingsSectionId,
): string {
  const item = SETTINGS_NAV_ITEMS.find((entry) => entry.id === sectionId);
  return item !== undefined ? t(item.labelKey) : t("settings.title");
}

export function resolveSettingsContentHeaderTitle(
  t: Translator,
  sectionId: SettingsSectionId,
): string {
  const sectionTitle = resolveSettingsSectionTitle(t, sectionId);
  return t("settings.content.title", { sectionTitle });
}

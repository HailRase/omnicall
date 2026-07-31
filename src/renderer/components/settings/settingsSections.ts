import type { IconSemanticId } from "../icons/iconCatalog.js";
import type { TranslationKey, Translator } from "../../i18n/index.js";

export type SettingsSectionId =
  | "account"
  | "general"
  | "sessions"
  | "system-state"
  | "diagnostics"
  | "notifications"
  | "codecs"
  | "video"
  | "headset"
  | "integrations"
  | "integrations-external-services"
  | "integrations-sdk";

export type SettingsNavLeaf = Readonly<{
  kind: "item";
  id: SettingsSectionId;
  labelKey: TranslationKey;
  iconId: IconSemanticId;
  testId: string;
}>;

export type SettingsNavGroup = Readonly<{
  kind: "group";
  id: string;
  labelKey: TranslationKey;
  iconId: IconSemanticId;
  testId: string;
  children: ReadonlyArray<SettingsNavLeaf>;
}>;

export type SettingsNavNode = SettingsNavLeaf | SettingsNavGroup;

/** Flat leaf list derived from SETTINGS_NAV_TREE (section content targets). */
export type SettingsNavItem = Readonly<{
  id: SettingsSectionId;
  labelKey: TranslationKey;
  iconId: IconSemanticId;
  testId: string;
}>;

export const SETTINGS_NAV_TREE: ReadonlyArray<SettingsNavNode> = [
  {
    kind: "item",
    id: "account",
    labelKey: "settings.nav.account",
    iconId: "settings.account",
    testId: "settings-nav-account",
  },
  {
    kind: "item",
    id: "general",
    labelKey: "settings.nav.general",
    iconId: "settings.general",
    testId: "settings-nav-general",
  },
  {
    kind: "item",
    id: "sessions",
    labelKey: "settings.nav.sessions",
    iconId: "settings.sessions",
    testId: "settings-nav-sessions",
  },
  {
    kind: "item",
    id: "system-state",
    labelKey: "settings.nav.systemState",
    iconId: "settings.system-state",
    testId: "settings-nav-system-state",
  },
  {
    kind: "item",
    id: "diagnostics",
    labelKey: "settings.nav.diagnostics",
    iconId: "shell.diagnostics",
    testId: "settings-nav-diagnostics",
  },
  {
    kind: "item",
    id: "notifications",
    labelKey: "settings.nav.notifications",
    iconId: "settings.notifications",
    testId: "settings-nav-notifications",
  },
  {
    kind: "item",
    id: "codecs",
    labelKey: "settings.nav.codecs",
    iconId: "settings.codecs",
    testId: "settings-nav-codecs",
  },
  {
    kind: "item",
    id: "video",
    labelKey: "settings.nav.video",
    iconId: "settings.video",
    testId: "settings-nav-video",
  },
  {
    kind: "item",
    id: "headset",
    labelKey: "settings.nav.headset",
    iconId: "settings.headset",
    testId: "settings-nav-headset",
  },
  // Always-open cluster in expanded SettingsSidebar (no accordion). Collapsed rail
  // shows group icon only. OmniCall Kit stays a top-level leaf below (ADR-0018).
  {
    kind: "group",
    id: "integrations-group",
    labelKey: "settings.nav.integrations",
    iconId: "settings.integrations",
    testId: "settings-nav-integrations",
    children: [
      {
        kind: "item",
        id: "integrations",
        labelKey: "settings.nav.integrations.ocp",
        iconId: "settings.integrations.ocp",
        testId: "settings-nav-integrations-ocp",
      },
      {
        kind: "item",
        id: "integrations-external-services",
        labelKey: "settings.nav.integrations.externalServices",
        iconId: "settings.integrations.external-services",
        testId: "settings-nav-integrations-external-services",
      },
    ],
  },
  // Top-level leaf immediately below Integrations (not a group child) — ADR-0018 / AF-004.
  {
    kind: "item",
    id: "integrations-sdk",
    labelKey: "settings.nav.integrations.sdk",
    iconId: "settings.integrations.sdk",
    testId: "settings-nav-integrations-sdk",
  },
];

export const SETTINGS_NAV_ITEMS: ReadonlyArray<SettingsNavItem> = SETTINGS_NAV_TREE.flatMap(
  (node) => {
    if (node.kind === "item") {
      return [
        {
          id: node.id,
          labelKey: node.labelKey,
          iconId: node.iconId,
          testId: node.testId,
        },
      ];
    }
    return node.children.map((child) => ({
      id: child.id,
      labelKey: child.labelKey,
      iconId: child.iconId,
      testId: child.testId,
    }));
  },
);

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "general";

const SETTINGS_SECTION_IDS: ReadonlyArray<SettingsSectionId> = SETTINGS_NAV_ITEMS.map(
  (entry) => entry.id,
);

export function isSettingsSectionId(value: unknown): value is SettingsSectionId {
  return typeof value === "string" && SETTINGS_SECTION_IDS.includes(value as SettingsSectionId);
}

export function isSettingsSectionInGroup(
  group: SettingsNavGroup,
  sectionId: SettingsSectionId,
): boolean {
  return group.children.some((child) => child.id === sectionId);
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

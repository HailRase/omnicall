import type { SettingsSectionId } from "../components/settings/settingsSections.js";

/**
 * - Purpose: typed shell navigation destinations independent of router implementation details.
 * - Inputs: route name and optional validated params.
 * - Outputs: discriminated union consumed by hooks and guards.
 */
export type ShellRoute =
  | Readonly<{ name: "dialpad" }>
  | Readonly<{ name: "history" }>
  | Readonly<{ name: "historyDetails"; entryId: string }>
  | Readonly<{ name: "contacts" }>
  | Readonly<{ name: "contactDetails"; contactId: string }>
  | Readonly<{ name: "contactEdit"; contactId: string }>
  | Readonly<{ name: "settings"; section?: SettingsSectionId }>;

export type ParsedShellRoute =
  | Readonly<{ name: "dialpad" }>
  | Readonly<{ name: "history" }>
  | Readonly<{ name: "historyDetails"; entryId: string; notFound: false }>
  | Readonly<{ name: "historyDetails"; entryId: string; notFound: true }>
  | Readonly<{ name: "contacts" }>
  | Readonly<{ name: "contactDetails"; contactId: string; notFound: false }>
  | Readonly<{ name: "contactDetails"; contactId: string; notFound: true }>
  | Readonly<{ name: "contactEdit"; contactId: string; notFound: false }>
  | Readonly<{ name: "contactEdit"; contactId: string; notFound: true }>
  | Readonly<{ name: "settings"; section: SettingsSectionId }>;

export type ShellRoutePresentation = "none" | "sidebar" | "fullPanel";

export type ShellNavigationGuardContext = Readonly<{
  hasActiveCallContext: boolean;
}>;

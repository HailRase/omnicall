import type { MenuItemConstructorOptions } from "electron";

export const MACOS_EDIT_MENU_ROLES = [
  "undo",
  "redo",
  "cut",
  "copy",
  "paste",
  "selectAll",
] as const satisfies ReadonlyArray<MenuItemConstructorOptions["role"]>;

export const MACOS_DEV_VIEW_MENU_ROLES = [
  "reload",
  "forceReload",
  "toggleDevTools",
] as const satisfies ReadonlyArray<MenuItemConstructorOptions["role"]>;

export type DarwinApplicationMenuOptions = Readonly<{
  includeDeveloperViewMenu?: boolean;
}>;

/**
 * - Purpose: build minimal macOS application menu with native edit shortcuts.
 * - Inputs: localized application name; optional developer View menu for dev builds.
 * - Outputs: menu template for App + Edit roles; View only when developer menu is enabled.
 */
export function buildDarwinApplicationMenuTemplate(
  appName: string,
  options: DarwinApplicationMenuOptions = {},
): MenuItemConstructorOptions[] {
  const menus: MenuItemConstructorOptions[] = [
    {
      label: appName,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll" },
      ],
    },
  ];

  if (options.includeDeveloperViewMenu === true) {
    menus.push({
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "toggleDevTools" },
      ],
    });
  }

  return menus;
}

export function getMacosEditMenuRoles(): ReadonlyArray<MenuItemConstructorOptions["role"]> {
  return MACOS_EDIT_MENU_ROLES;
}

export function getMacosDevViewMenuRoles(): ReadonlyArray<MenuItemConstructorOptions["role"]> {
  return MACOS_DEV_VIEW_MENU_ROLES;
}

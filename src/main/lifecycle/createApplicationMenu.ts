import { Menu, app } from "electron";

/**
 * - Purpose: install minimal application menu without File/Edit/View/Window/Help clutter.
 * - Inputs: none.
 * - Outputs: macOS app menu only; null menu on Windows and Linux.
 */
export function installApplicationMenu(): void {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
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
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

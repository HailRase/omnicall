import { Menu, app } from "electron";
import { buildDarwinApplicationMenuTemplate } from "./darwinApplicationMenuTemplate.js";
import { isMainProcessDevMode } from "./resolveMainProcessDevMode.js";

/**
 * - Purpose: install platform application menu for clipboard/edit shortcuts.
 * - Inputs: runtime dev-mode flag for optional macOS developer View menu.
 * - Outputs: macOS App+Edit menu (+ View in dev); null menu on Windows and Linux.
 */
export function installApplicationMenu(): void {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }

  Menu.setApplicationMenu(
    Menu.buildFromTemplate(
      buildDarwinApplicationMenuTemplate(app.name, {
        includeDeveloperViewMenu: isMainProcessDevMode(),
      }),
    ),
  );
}

export {
  buildDarwinApplicationMenuTemplate,
  getMacosEditMenuRoles,
  getMacosDevViewMenuRoles,
} from "./darwinApplicationMenuTemplate.js";

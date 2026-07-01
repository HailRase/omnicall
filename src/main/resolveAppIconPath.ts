import { app } from "electron";
import { existsSync } from "node:fs";
import { join } from "node:path";

export type AppIconTheme = "light" | "dark";

/**
 * - Purpose: resolve runtime icon file path for current theme and environment.
 * - Inputs: icon theme and packaged/dev runtime context.
 * - Outputs: absolute PNG path for Electron APIs or null if missing.
 */
export function resolveAppIconPath(theme: AppIconTheme): string | null {
  const fileName = `icon-${theme}.png`;

  if (app.isPackaged) {
    const packagedPath = join(process.resourcesPath, "theme-icons", fileName);
    if (existsSync(packagedPath)) {
      return packagedPath;
    }
    return null;
  }

  const devCandidates = [
    join(process.cwd(), "build", "theme-icons", fileName),
    join(__dirname, "../../build/theme-icons", fileName),
  ];

  for (const candidate of devCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

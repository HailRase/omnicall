import { app } from "electron";
import { existsSync } from "node:fs";
import { join } from "node:path";

export type AppIconTheme = "light" | "dark";

function resolveRuntimeIconDirectory(): string {
  if (process.platform === "win32") {
    return "windows-theme-icons";
  }
  return "theme-icons";
}

/**
 * - Purpose: resolve runtime icon file path for current theme and environment.
 * - Inputs: icon theme and packaged/dev runtime context.
 * - Outputs: absolute PNG path for Electron APIs or null if missing.
 */
export function resolveAppIconPath(theme: AppIconTheme): string | null {
  const fileName = `icon-${theme}.png`;
  const iconDirectory = resolveRuntimeIconDirectory();

  if (app.isPackaged) {
    const packagedPath = join(process.resourcesPath, iconDirectory, fileName);
    if (existsSync(packagedPath)) {
      return packagedPath;
    }
    return null;
  }

  const devCandidates = [
    join(process.cwd(), "build", iconDirectory, fileName),
    join(__dirname, "../../build", iconDirectory, fileName),
  ];

  for (const candidate of devCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

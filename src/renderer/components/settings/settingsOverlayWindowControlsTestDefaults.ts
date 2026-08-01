import { vi } from "vitest";
import type { ShellWindowControlsViewModel } from "../../hooks/useShellWindowControls.js";

export const settingsOverlayWindowControlsTestDefaults: ShellWindowControlsViewModel = {
  platform: "linux",
  showNativeWindowControls: true,
  isShuttingDown: false,
  maximizeEnabled: true,
  isMaximized: false,
  isPinned: false,
  onMinimize: vi.fn(),
  onClose: vi.fn(),
  onRestart: vi.fn(),
  onToggleMaximize: vi.fn(),
  onTogglePin: vi.fn(),
};

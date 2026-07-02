# Build resources

- Purpose: platform icons and macOS entitlements for electron-builder.
- Inputs: `npm run build:icons` generates `icon.png`, `icon.ico`, `icon.icns`, `icons/{N}x{N}.png`, `theme-icons/`.
- Outputs: installer branding from `directories.buildResources` (`build/`).
- Linux menu icons require `build/icons/` with `16x16.png` … `512x512.png` (not bare `icon.png`).
- Windows ships NSIS `.exe` and MSI `.msi`; both use `icon.ico`.
- Run `npm run build:icons` before release cuts if artwork changes.

# Build resources

- Purpose: platform icons and macOS entitlements for electron-builder.
- Inputs: `icon.png` (512×512 or 1024×1024), optional `icon.ico`, `icon.icns`.
- Outputs: installer branding consumed from `directories.buildResources`.
- Place `icon.png` here before release; electron-builder generates `.ico`/`.icns` when missing.
- Replace with final product artwork before public distribution.

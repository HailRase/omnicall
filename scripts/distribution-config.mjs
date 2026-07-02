/**
 * Public distribution repo (installers + manifest only).
 * Source code lives in HailRase/softphone-electron (private).
 */

export const SOURCE_REPO = 'HailRase/softphone-electron';
export const DISTRIBUTION_REPO = 'HailRase/axatalk-releases';
export const DISTRIBUTION_MANIFEST_PATH = 'update-manifest.json';
export const DISTRIBUTION_MANIFEST_RAW_URL =
  `https://raw.githubusercontent.com/${DISTRIBUTION_REPO}/main/${DISTRIBUTION_MANIFEST_PATH}`;
export const DISTRIBUTION_RELEASES_URL =
  `https://github.com/${DISTRIBUTION_REPO}/releases/latest`;

/** Installer extensions published to distribution releases (no blockmap/yml). */
export const DISTRIBUTION_INSTALLER_EXTENSIONS = ['.exe', '.msi', '.dmg', '.AppImage', '.deb'];

/** electron-builder artifactName prefix — excludes win-unpacked Axatalk.exe / elevate.exe. */
export const DISTRIBUTION_INSTALLER_NAME_PREFIX = /^Axatalk-\d+\.\d+\.\d+-/;

export function isDistributionInstallerFile(name) {
  return (
    DISTRIBUTION_INSTALLER_NAME_PREFIX.test(name) &&
    DISTRIBUTION_INSTALLER_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
}

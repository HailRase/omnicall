type ParsedSemanticVersion = Readonly<{
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}>;

function parseNumericPart(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function parseSemanticVersion(value: string): ParsedSemanticVersion | null {
  const trimmed = value.trim();
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(trimmed);
  if (match === null) {
    return null;
  }

  const major = parseNumericPart(match[1] ?? "");
  const minor = parseNumericPart(match[2] ?? "");
  const patch = parseNumericPart(match[3] ?? "");
  if (major === null || minor === null || patch === null) {
    return null;
  }

  const prerelease = match[4] ?? null;
  return { major, minor, patch, prerelease };
}

/**
 * - Purpose: compare two semantic version strings safely.
 * - Inputs: left and right version strings.
 * - Outputs: -1 when left is older, 0 when equal, 1 when left is newer; null when either invalid.
 */
export function compareSemanticVersions(left: string, right: string): -1 | 0 | 1 | null {
  const leftParsed = parseSemanticVersion(left);
  const rightParsed = parseSemanticVersion(right);
  if (leftParsed === null || rightParsed === null) {
    return null;
  }

  if (leftParsed.major !== rightParsed.major) {
    return leftParsed.major < rightParsed.major ? -1 : 1;
  }

  if (leftParsed.minor !== rightParsed.minor) {
    return leftParsed.minor < rightParsed.minor ? -1 : 1;
  }

  if (leftParsed.patch !== rightParsed.patch) {
    return leftParsed.patch < rightParsed.patch ? -1 : 1;
  }

  if (leftParsed.prerelease === rightParsed.prerelease) {
    return 0;
  }

  if (leftParsed.prerelease === null) {
    return 1;
  }

  if (rightParsed.prerelease === null) {
    return -1;
  }

  return leftParsed.prerelease < rightParsed.prerelease ? -1 : 1;
}

/**
 * - Purpose: report whether a version string is a valid semantic version.
 * - Inputs: version string.
 * - Outputs: true when parseable.
 */
export function isValidSemanticVersion(value: string): boolean {
  return parseSemanticVersion(value) !== null;
}

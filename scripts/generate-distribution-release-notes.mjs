/**
 * Parse distribution/CHANGELOG.md and format a GitHub Release body for omnicall-releases.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DISTRIBUTION_REPO } from './distribution-config.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_CHANGELOG = join(repoRoot, 'distribution/CHANGELOG.md');

const SECTION_KEYS = {
  added: 'added',
  changed: 'changed',
  fixed: 'fixed',
  highlights: 'highlights',
  knownnotes: 'knownNotes',
};

const FALLBACK_BODY =
  'Release notes were not recorded for this version. Future releases will include detailed changes.';

/**
 * @param {string} version e.g. "0.1.3" (no v prefix)
 */
export function parsePublicChangelogEntry(version) {
  if (!existsSync(PUBLIC_CHANGELOG)) {
    return null;
  }

  const text = readFileSync(PUBLIC_CHANGELOG, 'utf8');
  const headerPattern = new RegExp(
    `^## \\[${escapeRegex(version)}\\] - (\\d{4}-\\d{2}-\\d{2})\\s*$`,
    'm',
  );
  const headerMatch = headerPattern.exec(text);
  if (headerMatch === null) {
    return null;
  }

  const start = headerMatch.index + headerMatch[0].length;
  const rest = text.slice(start);
  const nextVersion = rest.search(/^## \[/m);
  const block = nextVersion === -1 ? rest : rest.slice(0, nextVersion);

  /** @type {{ date: string, sections: Record<string, string[]> }} */
  const entry = {
    date: headerMatch[1],
    sections: {
      highlights: [],
      added: [],
      changed: [],
      fixed: [],
      knownNotes: [],
    },
  };

  let currentKey = null;
  for (const line of block.split('\n')) {
    const sectionMatch = /^### (.+)$/.exec(line.trim());
    if (sectionMatch !== null) {
      const normalized = sectionMatch[1].toLowerCase().replace(/\s+/g, '');
      currentKey = SECTION_KEYS[normalized] ?? null;
      continue;
    }

    const bulletMatch = /^- (.+)$/.exec(line.trim());
    if (bulletMatch !== null && currentKey !== null) {
      entry.sections[currentKey].push(bulletMatch[1].trim());
    }
  }

  return entry;
}

/**
 * @param {string} tag e.g. "v0.1.3"
 */
export function versionFromTag(tag) {
  return tag.startsWith('v') ? tag.slice(1) : tag;
}

/**
 * @param {{ tag: string, entry: { date: string, sections: Record<string, string[]> } | null }} input
 */
export function formatDistributionReleaseBody({ tag, entry }) {
  const version = versionFromTag(tag);

  if (entry === null) {
    return FALLBACK_BODY;
  }

  const lines = [
    `## OmniCall v${version}`,
    '',
    `**Release date:** ${entry.date}`,
    '',
  ];

  appendSection(lines, 'Highlights', entry.sections.highlights);
  appendSection(lines, 'Added', entry.sections.added);
  appendSection(lines, 'Changed', entry.sections.changed);
  appendSection(lines, 'Fixed', entry.sections.fixed);
  appendSection(lines, 'Known Notes', entry.sections.knownNotes);

  lines.push('### Distribution artifacts', '');
  lines.push(`- Windows: \`OmniCall-${version}-win-x64.exe\`, \`OmniCall-${version}-win-x64.msi\``);
  lines.push(`- macOS: \`OmniCall-${version}-mac-arm64.dmg\``);
  lines.push(
    `- Linux: \`OmniCall-${version}-linux-x86_64.AppImage\`, \`OmniCall-${version}-linux-amd64.deb\``,
  );
  lines.push('');
  lines.push('### Updates', '');
  lines.push(
    `In-app update checks read [update-manifest.json](https://github.com/${DISTRIBUTION_REPO}/blob/main/update-manifest.json) on \`main\`.`,
  );

  return lines.join('\n').trim();
}

/**
 * @param {string} tag
 */
export function generateDistributionReleaseNotes(tag) {
  const version = versionFromTag(tag);
  const entry = parsePublicChangelogEntry(version);
  return formatDistributionReleaseBody({ tag, entry });
}

function appendSection(lines, title, items) {
  if (items.length === 0) {
    return;
  }
  lines.push(`### ${title}`, '');
  for (const item of items) {
    lines.push(`- ${item}`);
  }
  lines.push('');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

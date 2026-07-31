import { describe, expect, it } from 'vitest';
import {
  formatDistributionReleaseBody,
  generateDistributionReleaseNotes,
  parsePublicChangelogEntry,
} from './generate-distribution-release-notes.mjs';

describe('generate-distribution-release-notes', () => {
  it('parses a public changelog entry with sections', () => {
    const entry = parsePublicChangelogEntry('0.1.3');
    expect(entry).not.toBeNull();
    expect(entry?.date).toBe('2026-07-05');
    expect(entry?.sections.fixed).toHaveLength(1);
  });

  it('formats a structured GitHub release body', () => {
    const entry = parsePublicChangelogEntry('0.1.0');
    const body = formatDistributionReleaseBody({ tag: 'v0.1.0', entry });
    expect(body).toContain('## OmniCall v0.1.0');
    expect(body).toContain('### Added');
    expect(body).toContain('### Distribution artifacts');
    expect(body).toContain('update-manifest.json');
  });

  it('returns fallback body when changelog entry is missing', () => {
    const body = generateDistributionReleaseNotes('v9.9.9');
    expect(body).toContain('Release notes were not recorded');
  });
});

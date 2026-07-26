import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CAPABILITY_IDS,
  DEFAULT_CAPABILITY_PROFILES,
  EVENT_TYPES,
  REQUEST_DEDUP_TTL_SECONDS,
  V1_DEFERRED_CAMPAIGN_EVENTS,
  findForbiddenWireKeys,
  isCommandAvailableInProductV1,
  isDeferredCampaignEventType,
  isIncompatibleProtocolVersion,
  negotiateProtocolVersion,
  productDenialCodeForCommand,
  validateDiscoveryDocument,
  validateWireMessage
} from './index.js';

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../fixtures'
);

function readJson(relativePath: string): unknown {
  const fullPath = path.join(fixturesRoot, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as unknown;
}

function listJsonFiles(suiteRoot: string): string[] {
  const absolute = path.join(fixturesRoot, suiteRoot);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.json')) {
        out.push(path.relative(fixturesRoot, full).split(path.sep).join('/'));
      }
    }
  };
  walk(absolute);
  return out.sort();
}

describe('@axata/axatalk-protocol fixtures', () => {
  it('accepts every valid fixture', () => {
    const files = listJsonFiles('valid');
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const value = readJson(file);
      if (file.includes('/discovery/')) {
        const result = validateDiscoveryDocument(value);
        expect(result.success, file).toBe(true);
      } else {
        const result = validateWireMessage(value);
        expect(result.success, file).toBe(true);
      }
      expect(findForbiddenWireKeys(value)).toEqual([]);
    }
  });

  it('rejects every invalid fixture with the documented meta code', () => {
    const files = listJsonFiles('invalid');
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const value = readJson(file);
      const metaRel = file
        .replace(/^invalid\//, 'meta/')
        .replace(/\.json$/, '.meta.json');
      const meta = readJson(metaRel) as { expectedErrorCode: string };
      const result = file.includes('/discovery/')
        ? validateDiscoveryDocument(value)
        : validateWireMessage(value);
      expect(result.success, file).toBe(false);
      if (!result.success) {
        expect(result.code, file).toBe(meta.expectedErrorCode);
      }
    }
  });

  it('parses window:hide schema but marks it unavailable in v1 product surface', () => {
    const value = readJson('valid/command/window-hide-schema-only.json');
    const parsed = validateWireMessage(value);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.kind === 'command') {
      expect(isCommandAvailableInProductV1(parsed.data.type)).toBe(false);
      expect(productDenialCodeForCommand(parsed.data.type)).toBe('forbidden');
    }
    const meta = readJson(
      'meta/command/window-hide-product-deny.meta.json'
    ) as { expectedErrorCode: string };
    expect(meta.expectedErrorCode).toBe('forbidden');
  });

  it('strips unknown additive keys (ADR-0014 compatibility) without failing', () => {
    const value = readJson('valid/command/sdk-ping-unknown-key-stripped.json');
    const parsed = validateWireMessage(value);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.kind === 'command') {
      expect(parsed.data.type).toBe('sdk:ping');
      expect('futureOptionalField' in parsed.data).toBe(false);
      if (parsed.data.type === 'sdk:ping') {
        expect(parsed.data.payload).toEqual({ nonce: 'nonce_ping_001' });
        expect('futurePayloadField' in parsed.data.payload).toBe(false);
      }
    }
  });
});

describe('@axata/axatalk-protocol compatibility and constants', () => {
  it('negotiates overlapping protocol majors', () => {
    expect(negotiateProtocolVersion(1, 1, 1, 2)).toEqual({
      ok: true,
      selectedVersion: 1
    });
    expect(negotiateProtocolVersion(2, 2, 1, 1).ok).toBe(false);
    expect(isIncompatibleProtocolVersion(2, 3)).toBe(true);
  });

  it('locks capability ids and default profiles', () => {
    expect(CAPABILITY_IDS).toContain('session.read.redacted');
    expect(DEFAULT_CAPABILITY_PROFILES.presentation).toEqual([
      'session.read.redacted',
      'window.show'
    ]);
    expect(DEFAULT_CAPABILITY_PROFILES.call_controller).not.toContain(
      'account.activate'
    );
    expect(DEFAULT_CAPABILITY_PROFILES.call_controller).not.toContain(
      'window.hide'
    );
    expect(REQUEST_DEDUP_TTL_SECONDS).toBe(120);
  });

  it('includes campaign events in v1 unions (ADR-0019)', () => {
    expect(EVENT_TYPES).toContain('operator:campaign-offered');
    expect(EVENT_TYPES).toContain('operator:campaign-cleared');
    expect(V1_DEFERRED_CAMPAIGN_EVENTS).toEqual([]);
    expect(isDeferredCampaignEventType('operator:campaign-offered')).toBe(
      false
    );
    expect(DEFAULT_CAPABILITY_PROFILES.operator).toContain(
      'operator.campaign.read'
    );
    expect(DEFAULT_CAPABILITY_PROFILES.operator).toContain('ocp.acd_context.read');
    expect(DEFAULT_CAPABILITY_PROFILES.presentation).not.toContain(
      'operator.campaign.read'
    );
    expect(DEFAULT_CAPABILITY_PROFILES.presentation).not.toContain(
      'ocp.acd_context.read'
    );
  });

  it('fails closed on oversized messages without throwing', () => {
    const huge = {
      protocolVersion: 1,
      kind: 'command',
      type: 'sdk:ping',
      requestId: 'req',
      serverInstanceId: 'srv',
      sessionEpoch: 'epoch',
      occurredAt: '2026-07-20T09:00:00.000Z',
      payload: { nonce: 'x'.repeat(70_000) }
    };
    const result = validateWireMessage(huge, {
      maxBytes: 1024,
      maxDepth: 32,
      maxArrayLength: 512,
      maxObjectKeys: 128
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('invalid_message');
    }
  });
});

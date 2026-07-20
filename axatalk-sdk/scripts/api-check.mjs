#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packages = ['protocol', 'sdk'];

/** SDK-06 allowlist — auth + read path + namespaced call control. */
const SDK_ALLOWED_SYMBOLS = new Set([
  'AuthClient',
  'AuthClientOptions',
  'AuthSessionSnapshot',
  'AxatalkCallsApi',
  'AxatalkClient',
  'AxatalkClientError',
  'AxatalkClientOptions',
  'AxatalkEvent',
  'AxatalkWindowApi',
  'CallMutationResult',
  'CONNECTION_STATES',
  'ConnectionState',
  'DiagnosticEvent',
  'DiagnosticLevel',
  'DiagnosticResult',
  'DiagnosticsSink',
  'FakeScheduler',
  'HeartbeatPolicy',
  'JitterSource',
  'PUBLIC_EVENT_TYPES',
  'PairingRequiredInfo',
  'PopKeyStore',
  'PublicEventType',
  'ReconnectPolicy',
  'Scheduler',
  'StoredPopIdentity',
  'TimerHandle',
  'TransportCloseInfo',
  'TransportErrorInfo',
  'TransportFactory',
  'TransportPort',
  'createAuthClient',
  'createAxatalkClient',
  'createFakeScheduler',
  'createFixedJitterSource',
  'createIndexedDbPopKeyStore',
  'createMemoryPopKeyStore',
  'createRecordingDiagnosticsSink',
  'isAxatalkClientError'
]);

const SDK_FORBIDDEN_SYMBOLS = new Set([
  'activateProfile',
  'prepareLogout',
  'confirmLogout'
]);

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 */
function run(command, args, cwd) {
  console.log(`\n> ${command} ${args.join(' ')} (cwd=${path.relative(root, cwd) || '.'})`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/**
 * @param {string} report
 * @returns {string[]}
 */
function listPublicSymbols(report) {
  const matches = [
    ...report.matchAll(
      /^\s*(export\s+(?:declare\s+)?(?:class|function|const|interface|type|enum)\s+(\w+))/gm
    )
  ];
  return matches.map((m) => m[2]).filter((name) => typeof name === 'string');
}

const reportDir = path.join(root, 'etc', 'api');
const tempDir = path.join(root, 'temp', 'api');
fs.mkdirSync(reportDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

for (const name of packages) {
  const pkgDir = path.join(root, name === 'protocol' ? 'packages/protocol' : 'packages/sdk');
  const distEntry = path.join(pkgDir, 'dist', 'index.d.ts');
  if (!fs.existsSync(distEntry)) {
    console.error(`Missing build output for @axatalk/${name}: ${distEntry}`);
    console.error('Run `npm run build` before api:check.');
    process.exit(1);
  }
  run(
    'npx',
    [
      'api-extractor',
      'run',
      '--local',
      '--verbose',
      '--typescript-compiler-folder',
      path.join(root, 'node_modules', 'typescript')
    ],
    pkgDir
  );
}

for (const name of packages) {
  const reportPath = path.join(reportDir, `${name}.api.md`);
  if (!fs.existsSync(reportPath)) {
    console.error(`API report missing: ${reportPath}`);
    process.exit(1);
  }
  const report = fs.readFileSync(reportPath, 'utf8');
  const symbols = listPublicSymbols(report);

  if (name === 'sdk') {
    if (symbols.length === 0) {
      console.error(`Expected SDK-06 public surface in ${reportPath}`);
      process.exit(1);
    }
    for (const symbol of symbols) {
      if (SDK_FORBIDDEN_SYMBOLS.has(symbol)) {
        console.error(`Forbidden public symbol in SDK API: ${symbol}`);
        process.exit(1);
      }
      if (!SDK_ALLOWED_SYMBOLS.has(symbol)) {
        console.error(`Unexpected public SDK symbol (not in SDK-06 allowlist): ${symbol}`);
        process.exit(1);
      }
    }
    if (!symbols.includes('createAxatalkClient')) {
      console.error('SDK API must export createAxatalkClient');
      process.exit(1);
    }
    if (!symbols.includes('AxatalkClient')) {
      console.error('SDK API must export AxatalkClient');
      process.exit(1);
    }
    if (!symbols.includes('AxatalkCallsApi')) {
      console.error('SDK API must export AxatalkCallsApi');
      process.exit(1);
    }
    const clientMatch = report.match(
      /export type AxatalkClient = \{([\s\S]*?)\n\};/
    );
    if (clientMatch !== null && /^\s*readonly originate:/m.test(clientMatch[1])) {
      console.error(
        'Root-level originate is forbidden; use namespaced AxatalkCallsApi'
      );
      process.exit(1);
    }
    if (!report.includes('readonly calls:')) {
      console.error('AxatalkClient must expose namespaced calls API');
      process.exit(1);
    }
    console.log(
      `API report OK (sdk surface ${symbols.length} symbols): ${path.relative(root, reportPath)}`
    );
    continue;
  }

  if (symbols.includes('AxatalkClient')) {
    console.error(`Forbidden public symbol AxatalkClient in ${reportPath}`);
    process.exit(1);
  }
  if (symbols.length === 0) {
    console.error(`Expected public protocol API symbols in ${reportPath}`);
    process.exit(1);
  }
  console.log(
    `API report OK (protocol surface ${symbols.length} symbols, no AxatalkClient): ${path.relative(root, reportPath)}`
  );
}

console.log('\napi:check PASS');

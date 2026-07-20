#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packages = ['protocol', 'sdk'];

/** SDK-07 allowlist — auth + read path + calls + namespaced operator/account logout. */
const SDK_ALLOWED_SYMBOLS = new Set([
  'AuthClient',
  'AuthClientOptions',
  'AuthSessionSnapshot',
  'AxatalkAccountApi',
  'AxatalkCallsApi',
  'AxatalkClient',
  'AxatalkClientError',
  'AxatalkClientOptions',
  'AxatalkEvent',
  'AxatalkOperatorApi',
  'AxatalkWindowApi',
  'CallMutationResult',
  'ConfirmLogoutResult',
  'CONNECTION_STATES',
  'ConnectionState',
  'DiagnosticEvent',
  'DiagnosticLevel',
  'DiagnosticResult',
  'DiagnosticsSink',
  'FakeScheduler',
  'HeartbeatPolicy',
  'JitterSource',
  'OperatorReason',
  'OperatorReasonsResult',
  'OperatorStatusChangeResult',
  'PUBLIC_EVENT_TYPES',
  'PairingRequiredInfo',
  'PopKeyStore',
  'PrepareLogoutResult',
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

/** Top-level exports forbidden (namespaced methods are not separate symbols). */
const SDK_FORBIDDEN_SYMBOLS = new Set([
  'activateProfile',
  'prepareLogout',
  'confirmLogout',
  'changeStatus',
  'getReasons'
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
      console.error(`Expected SDK-07 public surface in ${reportPath}`);
      process.exit(1);
    }
    for (const symbol of symbols) {
      if (SDK_FORBIDDEN_SYMBOLS.has(symbol)) {
        console.error(`Forbidden public symbol in SDK API: ${symbol}`);
        process.exit(1);
      }
      if (!SDK_ALLOWED_SYMBOLS.has(symbol)) {
        console.error(`Unexpected public SDK symbol (not in SDK-07 allowlist): ${symbol}`);
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
    if (!symbols.includes('AxatalkOperatorApi')) {
      console.error('SDK API must export AxatalkOperatorApi');
      process.exit(1);
    }
    if (!symbols.includes('AxatalkAccountApi')) {
      console.error('SDK API must export AxatalkAccountApi');
      process.exit(1);
    }
    const clientMatch = report.match(
      /export type AxatalkClient = \{([\s\S]*?)\n\};/
    );
    if (clientMatch !== null) {
      const body = clientMatch[1];
      if (/^\s*readonly originate:/m.test(body)) {
        console.error(
          'Root-level originate is forbidden; use namespaced AxatalkCallsApi'
        );
        process.exit(1);
      }
      if (/^\s*readonly prepareLogout:/m.test(body)) {
        console.error(
          'Root-level prepareLogout is forbidden; use namespaced AxatalkAccountApi'
        );
        process.exit(1);
      }
      if (/^\s*readonly changeStatus:/m.test(body)) {
        console.error(
          'Root-level changeStatus is forbidden; use namespaced AxatalkOperatorApi'
        );
        process.exit(1);
      }
      if (/^\s*readonly activateProfile:/m.test(body)) {
        console.error('Root-level activateProfile is forbidden (SDK-08)');
        process.exit(1);
      }
    }
    if (!report.includes('readonly calls:')) {
      console.error('AxatalkClient must expose namespaced calls API');
      process.exit(1);
    }
    if (!report.includes('readonly operator:')) {
      console.error('AxatalkClient must expose namespaced operator API');
      process.exit(1);
    }
    if (!report.includes('readonly account:')) {
      console.error('AxatalkClient must expose namespaced account API');
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

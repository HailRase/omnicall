/**
 * Validates Node.js version before electron-builder packaging.
 * electron-builder 26.15+ loads @noble/hashes (ESM) via require(); Node >=20.19 required.
 */

const current = process.versions.node.split('.').map(Number);
const minimum = [20, 19, 0];
const recommended = [22, 0, 0];

function compare(a, b) {
  for (let i = 0; i < 3; i += 1) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left > right) return 1;
    if (left < right) return -1;
  }
  return 0;
}

if (compare(current, minimum) < 0) {
  console.error(
    [
      `Node.js ${process.versions.node} is not supported for packaging.`,
      `Minimum: ${minimum.join('.')} (@noble/hashes ESM + electron-builder require).`,
      `Recommended: ${recommended.join('.')}+ (matches CI and install-instruction.md).`,
      'Install: https://nodejs.org/ — or use nvm/fnm with .nvmrc in repo root.',
    ].join('\n'),
  );
  process.exit(1);
}

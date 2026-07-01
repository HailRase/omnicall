/**
 * GitHub Releases API helpers for axatalk-releases (distribution writes).
 * Uses Bearer token directly — avoids gh CLI / GITHUB_TOKEN conflicts in Actions.
 */

import { readFileSync } from 'node:fs';

const API_VERSION = '2022-11-28';

function parseRepo(repo) {
  const [owner, name] = repo.split('/');
  if (!owner || !name) {
    throw new Error(`Invalid repo slug: ${repo}`);
  }
  return { owner, name };
}

function apiHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': API_VERSION,
  };
}

async function readErrorBody(res) {
  const text = await res.text();
  return text.length > 0 ? text : res.statusText;
}

/**
 * @returns {Promise<{ id: number } | null>} null when tag has no release
 */
export async function getReleaseByTag(token, repo, tag) {
  const { owner, name } = parseRepo(repo);
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/releases/tags/${encodeURIComponent(tag)}`,
    { headers: apiHeaders(token) },
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(
      `Check release ${tag} on ${repo}: HTTP ${res.status} ${await readErrorBody(res)}`,
    );
  }
  const data = await res.json();
  if (typeof data !== 'object' || data === null || typeof data.id !== 'number') {
    throw new Error(`Unexpected release payload for ${tag} on ${repo}`);
  }
  return { id: data.id };
}

/**
 * @returns {Promise<number>} release id
 */
export async function createRelease(token, repo, { tag, title, notes }) {
  const { owner, name } = parseRepo(repo);
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/releases`, {
    method: 'POST',
    headers: { ...apiHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: tag,
      name: title,
      body: notes,
      draft: false,
      prerelease: false,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Create release ${tag} on ${repo}: HTTP ${res.status} ${await readErrorBody(res)}`,
    );
  }
  const data = await res.json();
  if (typeof data !== 'object' || data === null || typeof data.id !== 'number') {
    throw new Error(`Unexpected create-release response for ${tag} on ${repo}`);
  }
  return data.id;
}

export async function uploadReleaseAsset(token, repo, releaseId, filePath, fileName) {
  const { owner, name } = parseRepo(repo);
  const body = readFileSync(filePath);
  const res = await fetch(
    `https://uploads.github.com/repos/${owner}/${name}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`,
    {
      method: 'POST',
      headers: {
        ...apiHeaders(token),
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(body.length),
      },
      body,
    },
  );
  if (!res.ok) {
    throw new Error(
      `Upload ${fileName} to ${repo} release ${releaseId}: HTTP ${res.status} ${await readErrorBody(res)}`,
    );
  }
}

export async function verifyDistributionToken(token, repo) {
  const { owner, name } = parseRepo(repo);
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: apiHeaders(token),
  });
  if (res.status === 401) {
    throw new Error(
      `Distribution token rejected (HTTP 401). Regenerate fine-grained PAT: Contents read+write on ${repo}.`,
    );
  }
  if (!res.ok) {
    throw new Error(
      `Verify access to ${repo}: HTTP ${res.status} ${await readErrorBody(res)}`,
    );
  }
}

// Reads and writes the site's files.
// On Vercel: through the GitHub API, so every save is a commit (with full
// history) and Vercel redeploys the site from it.
// Locally (SNL_LOCAL_DIR set by scripts/dev-server.mjs): straight to disk,
// so the editor can be tried without touching GitHub.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

const API = 'https://api.github.com';

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw new Error('GITHUB_REPO must look like owner/repo');
  return { token, repo, branch };
}

async function gh(path, init = {}) {
  const { token } = cfg();
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'site-editor',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Git's blob id, so local mode reports versions the same way GitHub does.
function blobSha(buf) {
  return createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
}

function localPath(dir, name) {
  const root = resolve(dir);
  const p = resolve(join(root, name));
  if (!p.startsWith(root + sep)) throw new Error('Bad path');
  return p;
}

// -> { text, sha } for a file on the live branch
export async function readFileFromSite(name) {
  const dir = process.env.SNL_LOCAL_DIR;
  if (dir) {
    const buf = await readFile(localPath(dir, name));
    return { text: buf.toString('utf8'), sha: blobSha(buf) };
  }
  const { repo, branch } = cfg();
  const data = await gh(`/repos/${repo}/contents/${encodeURIComponent(name)}?ref=${encodeURIComponent(branch)}`);
  return { text: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha };
}

// files: [{ path, data: Buffer }]. One commit with all of them.
// expect: { path, sha } — refuse if that file changed since it was loaded.
export async function commitFiles(files, message, expect) {
  const dir = process.env.SNL_LOCAL_DIR;
  if (dir) {
    if (expect) {
      const cur = blobSha(await readFile(localPath(dir, expect.path)));
      if (cur !== expect.sha) { const e = new Error('conflict'); e.status = 409; throw e; }
    }
    for (const f of files) await writeFile(localPath(dir, f.path), f.data);
    return { commit: 'local', url: null, shas: Object.fromEntries(files.map(f => [f.path, blobSha(f.data)])) };
  }

  const { repo, branch } = cfg();
  const ref = await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  const headSha = ref.object.sha;

  if (expect) {
    const cur = await gh(`/repos/${repo}/contents/${encodeURIComponent(expect.path)}?ref=${headSha}`);
    if (cur.sha !== expect.sha) { const e = new Error('conflict'); e.status = 409; throw e; }
  }

  const head = await gh(`/repos/${repo}/git/commits/${headSha}`);
  const tree = [];
  const shas = {};
  for (const f of files) {
    const blob = await gh(`/repos/${repo}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: f.data.toString('base64'), encoding: 'base64' }) });
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    shas[f.path] = blob.sha;
  }
  const newTree = await gh(`/repos/${repo}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
  const commit = await gh(`/repos/${repo}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }) });
  // force:false — fails instead of overwriting if someone pushed meanwhile
  await gh(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
  return { commit: commit.sha, url: `https://github.com/${repo}/commit/${commit.sha}`, shas };
}

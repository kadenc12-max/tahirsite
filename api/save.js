// POST { content, sha, headshot? } -> validates, rebuilds index.html with the
// shared renderer and saves content.json + index.html (+ headshot.jpg) in a
// single commit. Vercel then redeploys the site.
import { guard, readJson, send } from './_lib/auth.js';
import { commitFiles } from './_lib/store.js';
import { render, validate, youtubeId } from '../lib/render.js';

const MAX_PHOTO = 1024 * 1024; // 1 MB, after the editor shrinks it

function isJpeg(buf) {
  return buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

export default async function handler(req, res) {
  if (!guard(req, res, { method: 'POST' })) return;
  try {
    const body = await readJson(req);
    const content = body.content;
    if (typeof body.sha !== 'string' || !/^[0-9a-f]{40}$/.test(body.sha)) return send(res, 400, { error: 'Missing version id; reload the editor' });

    // Store bare YouTube IDs even if a full link was pasted.
    for (const j of content?.experience?.jobs ?? []) for (const c of j.clips ?? []) {
      const id = youtubeId(c.youtube);
      if (id) c.youtube = id;
    }

    const files = [];
    if (body.headshot != null) {
      const photo = Buffer.from(String(body.headshot), 'base64');
      if (!isJpeg(photo) || photo.length > MAX_PHOTO) return send(res, 400, { error: 'The photo must be a JPEG under 1 MB' });
      files.push({ path: 'headshot.jpg', data: photo });
      if (content && typeof content === 'object') content.headshot = `headshot.jpg?v=${Date.now()}`;
    }

    const errors = validate(content);
    if (errors.length) return send(res, 400, { error: 'Some fields need fixing', errors });

    files.unshift(
      { path: 'content.json', data: Buffer.from(JSON.stringify(content, null, 2) + '\n') },
      { path: 'index.html', data: Buffer.from(render(content)) },
    );

    const result = await commitFiles(files, 'Update site from the editor', { path: 'content.json', sha: body.sha });
    send(res, 200, { ok: true, sha: result.shas['content.json'], commit: result.commit, url: result.url, content });
  } catch (e) {
    if (e.status === 409 || e.status === 422) {
      return send(res, 409, { error: 'The site was changed somewhere else since you opened the editor. Reload to get the latest version, then redo your edits.' });
    }
    send(res, 500, { error: e.message });
  }
}

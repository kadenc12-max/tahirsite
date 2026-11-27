// GET: the current content.json from the live branch (not the cached site),
// plus its version id so a save can detect edits made elsewhere meanwhile.
import { guard, send } from './_lib/auth.js';
import { readFileFromSite } from './_lib/store.js';

export default async function handler(req, res) {
  if (!guard(req, res, { method: 'GET' })) return;
  try {
    const { text, sha } = await readFileFromSite('content.json');
    send(res, 200, { content: JSON.parse(text), sha });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}

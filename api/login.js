import { guard, passwordMatches, readJson, send, startSession } from './_lib/auth.js';

const wait = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (!guard(req, res, { method: 'POST', auth: false })) return;
  try {
    const { password } = await readJson(req);
    if (!passwordMatches(password)) {
      await wait(1200); // slows down password guessing
      return send(res, 401, { error: 'Wrong password' });
    }
    startSession(req, res);
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}

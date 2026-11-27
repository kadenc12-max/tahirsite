import { endSession, guard, send } from './_lib/auth.js';

export default async function handler(req, res) {
  if (!guard(req, res, { method: 'POST', auth: false })) return;
  endSession(req, res);
  send(res, 200, { ok: true });
}

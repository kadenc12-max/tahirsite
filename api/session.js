import { hasSession, send } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  try {
    send(res, 200, { loggedIn: hasSession(req) });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}

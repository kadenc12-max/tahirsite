// Login sessions for the editor.
// The password lives only in the ADMIN_PASSWORD environment variable on
// Vercel. A successful login sets an HttpOnly cookie holding an expiry time
// signed with SESSION_SECRET, so it can't be forged or read by page scripts.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'snl_session';
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET is missing or shorter than 32 characters');
  return s;
}

function sign(value) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function sameText(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordMatches(attempt) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || real.length < 12) throw new Error('ADMIN_PASSWORD is missing or shorter than 12 characters');
  return typeof attempt === 'string' && sameText(attempt, real);
}

function isLocal(req) {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || '');
}

function cookieAttrs(req, maxAge) {
  return `Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isLocal(req) ? '' : '; Secure'}`;
}

export function startSession(req, res) {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  res.setHeader('Set-Cookie', `${COOKIE}=${exp}.${sign(exp)}; ${cookieAttrs(req, MAX_AGE)}`);
}

export function endSession(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttrs(req, 0)}`);
}

export function hasSession(req) {
  const raw = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  return sameText(sig, sign(exp));
}

// Blocks requests sent from other websites (on top of SameSite cookies).
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return req.method === 'GET';
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// Shared guard: method, origin and (optionally) a valid session.
export function guard(req, res, { method, auth = true }) {
  if (req.method !== method) { send(res, 405, { error: 'Method not allowed' }); return false; }
  if (!sameOrigin(req)) { send(res, 403, { error: 'Blocked: request came from another site' }); return false; }
  if (method !== 'GET' && !/^application\/json/.test(req.headers['content-type'] || '')) { send(res, 415, { error: 'Send JSON' }); return false; }
  try {
    if (auth && !hasSession(req)) { send(res, 401, { error: 'Please log in again' }); return false; }
  } catch (e) {
    send(res, 500, { error: e.message }); return false;
  }
  return true;
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 3 * 1024 * 1024) throw new Error('Request too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

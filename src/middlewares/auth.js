const crypto = require('crypto');
const User = require('../models/User');

const COOKIE_NAME = 'alumni_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET or JWT_SECRET must contain at least 32 characters.');
  }
  return secret;
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function createSessionToken(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: String(user.id),
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  let expected;
  try { expected = sign(payload); } catch (_) { return null; }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.sub || !Number.isFinite(data.exp) || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch (_) {
    return null;
  }
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return null;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

async function authenticate(req, res, next) {
  try {
    const token = readCookie(req, COOKIE_NAME);
    const session = verifySessionToken(token);
    req.user = session ? await User.findById(session.sub) : null;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  if (req.path.startsWith('/api/') || req.accepts('json')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  return res.redirect('/login');
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return requireAuth(req, res, next);
    if (req.user.role !== role) {
      if (req.path.startsWith('/api/') || req.accepts('json')) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
      }
      return res.status(403).send('Bu sayfaya erişim yetkiniz yok.');
    }
    return next();
  };
}

module.exports = { authenticate, requireAuth, requireRole, createSessionToken, setSessionCookie, clearSessionCookie };

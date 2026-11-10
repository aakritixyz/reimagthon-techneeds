const { createHash, timingSafeEqual } = require('node:crypto');
const jwt = require('jsonwebtoken');
const COOKIE = 'tn_admin';
const digest = value => createHash('sha256').update(value).digest();
function validKey(key) {
  return typeof key === 'string' && !!process.env.ADMIN_KEY && timingSafeEqual(digest(key), digest(process.env.ADMIN_KEY));
}
function sameOrigin(req, res, next) {
  const origin = req.get('Origin');
  const allowed = [process.env.FRONTEND_ORIGIN || 'http://localhost:3000', 'http://127.0.0.1:3000'];
  if (origin && !allowed.includes(origin)) return res.status(403).json({ error: 'Untrusted request origin.' });
  next();
}
function authenticateAdmin(req, res, next) {
  if (validKey(req.get('x-admin-key'))) return next(); // Backwards-compatible local API access.
  const cookie = (req.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  try {
    const token = cookie?.slice(COOKIE.length + 1);
    const session = jwt.verify(token || '', process.env.JWT_SECRET, { algorithms: ['HS256'], audience: 'techneeds-admin' });
    if (session.role !== 'ADMIN') throw new Error('Forbidden');
    sameOrigin(req, res, next);
  } catch {
    res.status(401).json({ error: 'Sign in to the admin workspace.' });
  }
}
module.exports = authenticateAdmin;
module.exports.validKey = validKey;
module.exports.sameOrigin = sameOrigin;
module.exports.COOKIE = COOKIE;

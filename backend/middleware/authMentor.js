const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const { sameOrigin } = require('./authAdmin');
const readCookie = (req, name) => (req.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.slice(name.length + 1);
exports.readCookie = readCookie;
exports.authenticate = async (req, res, next) => {
  const headerToken = req.get('x-auth-token');
  const token = headerToken || readCookie(req, 'tn_mentor');
  if (!token) return res.status(401).json({ error: 'Sign in to the mentor workspace.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (decoded.role && decoded.role !== 'MENTOR') throw new Error();
    const mentor = await Mentor.findById(decoded.id).select('-password');
    if (!mentor) throw new Error();
    req.mentor = mentor;
    if (!headerToken) return sameOrigin(req, res, next);
    next();
  } catch { res.status(401).json({ error: 'Your mentor session has expired. Sign in again.' }); }
};
exports.authenticateMentee = async (req, res, next) => {
  try {
    const headerToken = req.get('x-auth-token');
    const decoded = jwt.verify(headerToken || readCookie(req, 'tn_mentee') || '', process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (decoded.role && decoded.role !== 'MENTEE') throw new Error();
    const mentee = await Mentee.findById(decoded.id).select('-password');
    if (!mentee || (decoded.ver || 0) !== (mentee.authVersion || 0)) throw new Error();
    req.mentee = mentee;
    if (mentee.mustChangePw && !['/change-password', '/session', '/session/migrate'].includes(req.path)) return res.status(403).json({ error: 'Change your initial password before continuing.', code: 'PASSWORD_CHANGE_REQUIRED' });
    if (!headerToken) return sameOrigin(req, res, next);
    next();
  } catch { res.status(401).json({ error: 'Your mentee session has expired. Sign in again.' }); }
};

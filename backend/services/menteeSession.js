const jwt = require('jsonwebtoken');
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
const sign = mentee => jwt.sign({ id: mentee._id, role: 'MENTEE', ver: mentee.authVersion || 0, mustChangePw: !!mentee.mustChangePw }, process.env.JWT_SECRET, { expiresIn: '7d' });
function setSession(res, mentee) { const token = sign(mentee); res.cookie('tn_mentee', token, { ...cookieOptions, maxAge: 7*86400000 }); return token; }
module.exports = { cookieOptions, setSession };

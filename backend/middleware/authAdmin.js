const { createHash, timingSafeEqual } = require('node:crypto');

function digest(value) {
  return createHash('sha256').update(value).digest();
}

module.exports = function authenticateAdmin(req, res, next) {
  const key = req.get('x-admin-key');
  const expected = process.env.ADMIN_KEY;
  if (!key || !expected || !timingSafeEqual(digest(key), digest(expected))) {
    return res.status(401).json({ error: 'Enter a valid local admin key.' });
  }
  next();
};

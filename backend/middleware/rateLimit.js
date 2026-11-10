// Local single-process limiter. Use a shared store when scaling to multiple API instances.
module.exports = function rateLimit({ limit = 10, windowMs = 15 * 60 * 1000, key: keyFor } = {}) {
  const attempts = new Map();
  return (req, res, next) => {
    if (require('../services/demoMode').demoEnabled()) return next();
    const now = Date.now(), key = keyFor ? keyFor(req) : req.ip;
    for (const [ip, item] of attempts) if (item.reset <= now) attempts.delete(ip);
    const item = attempts.get(key) || { count: 0, reset: now + windowMs };
    item.count++; attempts.set(key, item);
    if (item.count > limit) {
      res.set('Retry-After', String(Math.ceil((item.reset - now) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    next();
  };
};

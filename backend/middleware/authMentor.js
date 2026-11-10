const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');

exports.authenticate = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    // 1. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Find mentor and attach to request (excluding password)
    const mentor = await Mentor.findById(decoded.id).select('-password');
    if (!mentor) return res.status(401).json({ error: 'Mentor not found' });

    req.mentor = mentor; // Attach mentor to request
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- Mentee Authentication --- //
exports.authenticateMentee = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const mentee = await Mentee.findById(decoded.id).select('-password');
    
    if (!mentee) {
      return res.status(401).json({ error: 'Mentee not found' });
    }

    req.mentee = mentee;
    next();
  } catch (err) {
    console.error('Mentee token error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

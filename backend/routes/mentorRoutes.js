const express = require('express');
const { randomBytes } = require('node:crypto');
const authenticateAdmin = require('../middleware/authAdmin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const Program = require('../models/Program');
const Resource = require('../models/Resource');
const Mentee = require('../models/Mentee');
const Quiz = require('../models/Quiz');
const { authenticate } = require('../middleware/authMentor');
const router = express.Router();


// Create mentor credentials
router.post('/mentors', authenticateAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const tempPassword = password || randomBytes(12).toString('base64url');
    const mentor = new Mentor({
      name,
      email,
      password: await bcrypt.hash(tempPassword, 12)
    });
    await mentor.save();
    res.status(201).json({ mentor: { _id: mentor._id, name, email }, tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all mentors
router.get('/mentors', authenticateAdmin, async (req, res) => {
  try {
    const mentors = await Mentor.find().select('-password');
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all programs
router.get('/programs', authenticateAdmin, async (req, res) => {
  try {
    const programs = await Program.find();
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mentor Login
router.post('/mentors/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const mentor = typeof email === 'string' ? await Mentor.findOne({ email: email.trim().toLowerCase() }) : null;
    if (!mentor || typeof password !== 'string' || !(await bcrypt.compare(password, mentor.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: mentor._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { _id, name, email: mentorEmail, programs } = mentor;
    res.json({ token, mentor: { _id, name, email: mentorEmail, programs } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Create Program (Assign to Mentor)
router.get('/mentors/me', authenticate, async (req, res) => {
  const mentor = await req.mentor.populate('programs', 'name');
  res.json(mentor);
});

router.post('/programs', authenticateAdmin, async (req, res) => {
  try {
    const program = new Program({
      name: req.body.name // Auto-assign creator as mentor
    });
    await program.save();
    
    res.status(201).json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Mentor to Program (Manual via Thunder Client)
router.post('/programs/:programId/add-mentor', authenticateAdmin, async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);
    const mentor = await Mentor.findById(req.body.mentorId).select('-password');
    
    if (!program || !mentor) {
      return res.status(404).json({ error: 'Program/Mentor not found' });
    }
    
    await Program.updateOne({ _id: program._id }, { $addToSet: { mentors: mentor._id } });
    await Mentor.updateOne({ _id: mentor._id }, { $addToSet: { programs: program._id } });
    
    res.json({ programId: program._id, mentorId: mentor._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all mentees for a program
router.get('/:programId/mentees', authenticate, async (req, res) => {
  try {
    if (!req.mentor.programs.includes(req.params.programId)) return res.status(403).json({ error: 'Not assigned to this program' });
    const mentees = await Mentee.find({ programs: req.params.programId }).select('-password')
      .populate('completedResources.resource', 'title type'); 
    
    res.json(mentees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:programId/resources', authenticate, async (req, res) => {
  try {
    if (!req.mentor.programs.includes(req.params.programId)) return res.status(403).json({ error: 'Not assigned to this program' });
    const resources = await Resource.find({ program: req.params.programId })
      .sort({ createdAt: -1 }); // Newest first
    
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unverified-projects', authenticate, async (req, res) => {
  try {
    const mentor = req.mentor;

    // Find mentees having any completed resource which is a project & unverified
    const mentees = await Mentee.find({
      'completedResources.verified': false
    }).populate({
      path: 'completedResources.resource',
      populate: { path: 'program' }
    });

    const unverifiedProjects = [];
    mentees.forEach(mentee => {
      mentee.completedResources.forEach(resourceEntry => {
        const resObj = resourceEntry.resource;
        if (
          resObj && 
          resObj.type === 'project' &&
          resourceEntry.verified === false &&
          mentor.programs.map(p => p.toString()).includes(resObj.program?._id.toString())
        ) {
          unverifiedProjects.push({
            menteeId: mentee._id,
            menteeName: mentee.name,
            resourceId: resObj._id,
            resourceTitle: resObj.title,
            githubLink: resourceEntry.githubLink,
            deployedLink: resourceEntry.deployedLink,
            description: resourceEntry.description,
            submittedOn: resourceEntry.submittedOn
          });
        }
      });
    });

    res.json({ unverifiedProjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
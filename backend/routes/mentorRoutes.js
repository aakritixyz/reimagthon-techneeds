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
    const mentor = await Mentor.findOne({ email });
    if (!mentor || !(await bcrypt.compare(password, mentor.password))) {
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


// Add Resource (Only for assigned programs)
router.post('/resources', authenticate, async (req, res) => {
  try {
    const program = await Program.findById(req.body.program);
    if (!program || !program.mentors.includes(req.mentor._id)) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    const resource = new Resource({
      ...req.body,
      addedBy: req.mentor._id
    });

    await resource.save();

    program.resources.push(resource._id);

    await program.save();
    
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/quiz', authenticate, async (req, res) => {
  try {
    const { title, program, questions, startTime, endTime, maxScore, revealScores } = req.body;
    if (!Array.isArray(questions) || !questions.length || !(new Date(startTime) < new Date(endTime))) {
      return res.status(400).json({ error: 'A quiz needs questions and a valid opening and closing time.' });
    }

    const programDoc = await Program.findById(program);
    if (!programDoc || !programDoc.mentors.includes(req.mentor._id)) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    // Step 1: Create the Resource with type 'quiz'
    const resource = new Resource({
      title,
      type: 'quiz',
      program,
      maxScore,
      addedBy: req.mentor._id,
      deadline: endTime 
    });

    await resource.save();

    const quiz = new Quiz({
      resource: resource._id,
      questions,
      startTime,
      endTime,
      revealScores
    });

    await quiz.save();

    programDoc.resources.push(resource._id);
    await programDoc.save();

    res.status(201).json({ message: 'Quiz resource created', resource, quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Mentor adds a mentee (with auto-generated credentials)
router.post('/mentees', authenticate, async (req, res) => {
  try {
    const { email, name, enrollmentNumber, programId } = req.body;
    const mentor = req.mentor;

    // Check if mentor is assigned to the program
    const program = await Program.findById(programId);
    if (!program || !program.mentors.includes(mentor._id)) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    // Generate a random password (or let mentor set one)
    const tempPassword = randomBytes(12).toString('base64url');
    
    const mentee = new Mentee({
      email,
      name,
      enrollmentNumber: enrollmentNumber?.trim() || `TN-${randomBytes(8).toString('hex').toUpperCase()}`,
      password: await bcrypt.hash(tempPassword, 12),
      createdBy: mentor._id,
      programs: [programId]
    });
    await mentee.save();

    // Optional: Send email to mentee with credentials
    // await sendWelcomeEmail(mentee.email, enrollmentNumber, tempPassword);

    res.status(201).json({
      mentee: { _id: mentee._id, name: mentee.name, enrollmentNumber: mentee.enrollmentNumber },
      tempPassword
    });
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

// PATCH /mentees/:menteeId/resources/:resourceId/verify
router.patch('/:menteeId/resources/:resourceId/verify', authenticate, async (req, res) => {
  try {
    const { menteeId, resourceId } = req.params;
    const { score } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    if (!req.mentor.programs.includes(resource.program)) return res.status(403).json({ error: 'Not assigned to this program' });
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > resource.maxScore) {
      return res.status(400).json({ error: 'Enter a score between zero and the maximum.' });
    }

    if (resource.type !== 'project') {
      return res.status(400).json({ error: 'Only project-type resources can be verified' });
    }

    if (resource.isLocked) {
      return res.status(403).json({ error: 'Resource is currently locked' });
    }

    const mentee = await Mentee.findById(menteeId);
    if (!mentee || !mentee.programs.includes(resource.program)) return res.status(404).json({ error: 'Mentee not found' });

    const submission = mentee.completedResources.find(
      (entry) => entry.resource.toString() === resourceId
    );

    if (!submission) {
      return res.status(400).json({ error: 'Project not yet submitted by this mentee' });
    }

    if (submission.verified) {
      return res.status(400).json({ error: 'This project has already been verified' });
    }

    const finalScore = Math.min(score, resource.maxScore);
    submission.score = finalScore;
    submission.verified = true;
    submission.scoredOn = new Date();

    mentee.totalScore += finalScore;
    await mentee.save();

    res.json({ message: 'Project verified and scored', finalScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mentee = require('../models/Mentee');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Resource = require('../models/Resource');
const { authenticateMentee } = require('../middleware/authMentor');
const { buildStandings, periods, tracks } = require('../services/leaderboard');
const router = express.Router();


router.post('/login', async (req, res) => {
  const { enrollmentNumber, password } = req.body;
  try {
    const mentee = await Mentee.findOne({ enrollmentNumber });
    const validPassword = mentee && typeof password === 'string' && (
      mentee.password.startsWith('$2')
        ? await bcrypt.compare(password, mentee.password)
        : password === mentee.password
    );
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: mentee._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Mentee Dashboard --- //
router.get('/dashboard', authenticateMentee, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.mentee._id)
    .populate({
      path: 'programs',
      populate: {
        path: 'resources',
        model: 'Resource'
      }
    })  
    .populate({
      path: 'completedResources.resource',
      model: 'Resource'
    });
    const completedResources = mentee.completedResources.filter((entry) => entry.resource);
    // Map completedResources for quick lookup
    const completedMap = new Map();
    completedResources.forEach((item) => {
      completedMap.set(item.resource._id.toString(), {
        score: item.score,
        completedOn: item.completedOn
      });
    });

    const totalScore = mentee.completedResources.reduce((sum, item) => sum + (item.score || 0), 0);

    // Add completed status to each resource
    const updatedPrograms = mentee.programs.map((program) => {
      const updatedResources = program.resources.map((res) => {
        const isCompleted = completedMap.has(res._id.toString());
        return {
          ...res.toObject(),
          completed: isCompleted,
          score: isCompleted ? completedMap.get(res._id.toString()).score : null,
          completedOn: isCompleted ? completedMap.get(res._id.toString()).completedOn : null
        };
      });
      return {
        ...program.toObject(),
        resources: updatedResources
      };
    });
    res.json({
      name: mentee.name,
      email: mentee.email,
      completedResources: completedResources.map(({ resource, completedOn, score }) => ({
        title: resource.title, type: resource.type, completedOn, score
      })),
      streak: mentee.streak,
      totalScore,
      programs: updatedPrograms,
      rank: await calculateRank(mentee._id), // Implement this helper
    //   resources: await getResourcesWithStatus(mentee) // Implement this
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Resource Completion --- //
router.post('/resources/:id/complete', authenticateMentee, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    const mentee = req.mentee;

    // Check if resource is unlocked
    if (!resource || !mentee.programs.includes(resource.program)) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    if (resource.type !== 'video') {
      return res.status(400).json({ error: 'Complete the quiz or submit a project from its own form.' });
    }
    if (resource.isLocked) {
      return res.status(403).json({ error: 'Resource is locked' });
    }

    const existing = mentee.completedResources.find((entry) => entry.resource.equals(resource._id));
    if (existing) return res.json({ message: 'Resource already completed', score: existing.score });
    if (resource.deadline && new Date() > resource.deadline) {
      return res.status(403).json({ error: 'The deadline has passed.' });
    }
    const score = resource.maxScore;

    // Update mentee's progress
    const completedResource = {
      resource: resource._id,
      score,
      completedOn: new Date()
    };

    mentee.completedResources.push(completedResource);

    // Update streak (if active today)
    await updateStreak(mentee);
    await mentee.save();

    res.json({ message: 'Resource marked as completed!', score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/:id/quiz/submit', authenticateMentee, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const mentee = req.mentee;
    const answers = req.body.answers;
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'Submit an array of quiz answers.' });

    const resource = await Resource.findById(resourceId).populate('quiz');
    if (!resource || resource.type !== 'quiz' || !req.mentee.programs.includes(resource.program)) {
      return res.status(400).json({ error: 'Invalid quiz resource' });
    }

    if (resource.isLocked) {
      return res.status(403).json({ error: 'Quiz is locked' });
    }

    const quiz = await Quiz.findOne({resource:resourceId});
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const now = new Date();
    if (now < quiz.startTime || now > quiz.endTime) {
      return res.status(403).json({ error: 'Quiz is not active at this time' });
    }

    // Prevent resubmission
    const existing = await QuizSubmission.findOne({ quiz: quiz._id, mentee: mentee._id });
    if (existing) {
      return res.status(409).json({ error: 'Quiz already submitted' });
    }

    // Calculate score
    let totalScore = 0;
    for (const question of quiz.questions) {
      const userAnswer = answers.find(ans => ans.questionId === question._id.toString());
      if (userAnswer && userAnswer.selectedOptionIndex === question.correctOptionIndex) {
        totalScore += question.marks || 1;
      }
    }

    totalScore = Math.min(totalScore, resource.maxScore);

    // Save submission
    const submission = new QuizSubmission({
      quiz: quiz._id,
      resource: resourceId,
      mentee: mentee._id,
      answers,
      score: totalScore,
    });

    await submission.save();

    // Update mentee's resource progress
    const completedResource = {
      resource: resource._id,
      score: totalScore,
      completedOn: new Date()
    };

    const alreadyCompleted = mentee.completedResources.find(
      (r) => r.resource.toString() === resource._id.toString()
    );

    if (alreadyCompleted) {
      alreadyCompleted.score = totalScore;
      alreadyCompleted.completedOn = new Date();
    } else {
      mentee.completedResources.push(completedResource);
    }

    // Update streak and total score
    await updateStreak(mentee);
    // mentee.totalScore += totalScore;
    await mentee.save();

    res.status(200).json({ message: 'Quiz submitted successfully!', score: totalScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/resources/:id/quiz', authenticateMentee, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const resource = await Resource.findById(resourceId).populate('quiz');
    if (!resource || resource.type !== 'quiz' || !req.mentee.programs.includes(resource.program)) {
      return res.status(400).json({ error: 'Invalid resource or quiz not found' });
    }

    const quiz = await Quiz.findOne({ resource: resourceId });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({
      title: resource.title,
      description: resource.description,
      questions: quiz.questions.map((q) => ({
        id: q._id,
        questionText: q.questionText,
        options: q.options,
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/m/resources/:resourceId/project
router.post('/resources/:resourceId/project', authenticateMentee, async (req, res) => {
  try {
    const { githubLink, deployedLink, description } = req.body;
    const resource = await Resource.findById(req.params.resourceId);
    const mentee = req.mentee;

    if (!resource || !mentee.programs.includes(resource.program)) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.type !== 'project') {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    if (resource.isLocked) {
      return res.status(403).json({ error: 'Resource is locked' });
    }
    // Validate inputs
    if (!githubLink || !deployedLink || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (resource.deadline && new Date() > resource.deadline) {
      return res.status(403).json({ error: 'The deadline has passed.' });
    }

    // Create the completion entry
    const projectCompletion = {
      resource: resource._id,
      githubLink,
      deployedLink,
      description,
      score: 0, // Score to be updated by mentor later
      submittedOn: new Date(),
    };

    // Check if already completed
    const existing = mentee.completedResources.find(
      (c) => c.resource.toString() === resource._id.toString()
    );

    if (existing?.verified) return res.status(409).json({ error: 'This project has already been scored.' });

    if (existing) {
      existing.githubLink = githubLink;
      existing.deployedLink = deployedLink;
      existing.description = description;
      existing.submittedOn = new Date();
      existing.score = 0;
    } else {
      mentee.completedResources.push(projectCompletion);
    }
    await mentee.save();

    res.json({ message: 'Project submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Helper: Calculate rank (example: based on total score)
async function calculateRank(menteeId) {
  const me = await Mentee.findById(menteeId)
    .select('streak lastActiveDate completedResources.score')
    .lean();

  if (!me) return null;

  const myScore = (me.completedResources || [])
    .reduce((s, c) => s + (c?.score || 0), 0);
  const myStreak = me.streak || 0;
  const myLast   = me.lastActiveDate || new Date(0);

  // Count how many are strictly "better" in the same sort order
  const better = await Mentee.aggregate([
    {
      $project: {
        streak: { $ifNull: ['$streak', 0] },
        lastActiveDate: 1,
        totalScore: {
          $sum: {
            $map: {
              input: { $ifNull: ['$completedResources', []] },
              as: 'cr',
              in: { $ifNull: ['$$cr.score', 0] }
            }
          }
        }
      }
    },
    {
      $match: {
        $or: [
          { totalScore: { $gt: myScore } },
          { totalScore: myScore, streak: { $gt: myStreak } },
          { totalScore: myScore, streak: myStreak, lastActiveDate: { $gt: myLast } }
        ]
      }
    },
    { $count: 'cnt' }
  ]);

  return (better[0]?.cnt || 0) + 1;
}

// Helper: Update streak
async function updateStreak(mentee) {
  const today = new Date().toDateString();
  const lastActive = mentee.lastActiveDate?.toDateString();

  if (lastActive !== today) {
    mentee.streak = lastActive === new Date(Date.now() - 86400000).toDateString() 
      ? mentee.streak + 1 
      : 1;
    mentee.lastActiveDate = new Date();
  }
}

// --- Public Leaderboard --- //
// --- Public Leaderboard (same calc as dashboard) --- //
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const skip  = Math.max(parseInt(req.query.skip  || '0', 10), 0);

    // Compute totalScore = sum(completedResources.score)
    const rows = await Mentee.aggregate([
      {
        $project: {
          name: 1,
          streak: { $ifNull: ['$streak', 0] },
          lastActiveDate: 1,
          totalScore: {
            $sum: {
              $map: {
                input: { $ifNull: ['$completedResources', []] },
                as: 'cr',
                in: { $ifNull: ['$$cr.score', 0] }
              }
            }
          }
        }
      },
      // same ordering everywhere: score desc, streak desc, lastActive desc, _id asc (stable)
      { $sort: { totalScore: -1, streak: -1, lastActiveDate: -1, _id: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Attach 1-based rank consistent with global order + skip
    const leaderboard = rows.map((m, i) => ({
      rank: skip + i + 1,
      name: m.name,
      totalScore: m.totalScore || 0,
      streak: m.streak || 0
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



router.get('/leaderboard/standings', async (req, res) => {
  const { period = 'all', track = 'all', search = '' } = req.query;
  if (!periods.has(period) || typeof track !== 'string' ||
      (track !== 'all' && !Object.hasOwn(tracks, track)) || typeof search !== 'string') {
    return res.status(400).json({ error: 'Invalid leaderboard filters' });
  }

  const token = req.get('x-auth-token');
  let viewerId;
  if (token) {
    try {
      viewerId = jwt.verify(token, process.env.JWT_SECRET).id;
    } catch {
      // The standings are public. Expired sessions simply omit the personal card.
    }
  }

  try {
    const mentees = await Mentee.find()
      .select('name programs streak completedResources.resource completedResources.score completedResources.completedOn completedResources.scoredOn completedResources.verified')
      .populate('programs', 'name')
      .populate('completedResources.resource', 'type program maxScore')
      .lean();
    res.set('Cache-Control', 'private, no-store');
    res.json(buildStandings(mentees, { period, track, search: search.trim().slice(0, 80), viewerId, now: new Date() }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load the leaderboard' });
  }
});

module.exports = router;
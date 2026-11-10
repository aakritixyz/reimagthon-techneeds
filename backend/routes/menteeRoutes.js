const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mentee = require('../models/Mentee');
const Enrollment = require('../models/Enrollment');
const Resource = require('../models/Resource');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Audit = require('../models/AuditLog');
const { authenticateMentee, readCookie } = require('../middleware/authMentor');
const rateLimit = require('../middleware/rateLimit');
const { fail, validId, text, webUrl, errors, wrap } = require('../services/mentor');
const { streakFor, refreshProgress } = require('../services/progress');
const { buildStandings, periods, tracks } = require('../services/leaderboard');
const originalLeaderboard = require('../data/original-leaderboard.json');
const {demoEnabled,DEMO_MENTEE_ID}=require('../services/demoMode');
const { sameOrigin } = require('../middleware/authAdmin');
const { cookieOptions, setSession } = require('../services/menteeSession');
const { resourceView, projectUrl, cohortBoard, invalidateBoards, publicName } = require('../services/menteeLearning');
const router = express.Router();
const passwordMatches = (value, hash) => typeof value === 'string' && (hash.startsWith('$2') ? bcrypt.compare(value, hash) : Promise.resolve(value === hash));
router.post('/login', sameOrigin, rateLimit({ limit: 10, key: req => req.ip + '|' + String(req.body.identifier || req.body.enrollmentNumber || '').toLowerCase().slice(0, 254) }), wrap(async (req, res) => {
  if(demoEnabled()){
    const account=await Mentee.findByIdAndUpdate(DEMO_MENTEE_ID,{$set:{mustChangePw:false,failedLogins:0,lastLoginAt:new Date()},$unset:{lockedUntil:1}},{new:true});
    if(!account)throw fail('Reset the demo walkthrough to restore this account.',404);
    const token=setSession(res,account);return res.set('Cache-Control','no-store').json({token,mustChangePw:false,demo:true});
  }
  const identifier = req.body.identifier || req.body.enrollmentNumber;
  if (typeof identifier !== 'string') throw fail('Invalid credentials', 400);
  const value = identifier.trim();
  let mentee;
  if (value.includes('@')) mentee = await Mentee.findOne({ email: value.toLowerCase() });
  else {
    const enrollment = await Enrollment.findOne({ enrollmentNumber: value.toUpperCase() });
    mentee = enrollment ? await Mentee.findById(enrollment.mentee) : await Mentee.findOne({ enrollmentNumber: value });
  }
  if (!mentee) throw fail('Invalid credentials', 400);
  const result = await mongoose.connection.transaction(async session => {
    const account = await Mentee.findById(mentee._id).session(session);
    const now = new Date();
    if (account.lockedUntil && account.lockedUntil > now) {
      await Audit.create([{ actor: `MENTEE:${account._id}`, action: 'LOGIN_LOCKED', target: String(account._id) }], { session });
      return null;
    }
    if (account.lockedUntil && account.lockedUntil <= now) { account.failedLogins = 0; account.lockedUntil = undefined; }
    if (!(await passwordMatches(req.body.password, account.password))) {
      account.failedLogins = (account.failedLogins || 0) + 1;
      if (account.failedLogins >= 5) {
        account.lockedUntil = new Date(Date.now() + 15*60000);
        await Audit.create([{ actor: `MENTEE:${account._id}`, action: 'LOGIN_LOCKED', target: String(account._id) }], { session });
      }
      await account.save({ session }); return null;
    }
    account.failedLogins = 0; account.lockedUntil = undefined; account.lastLoginAt = now;
    await account.save({ session }); return account;
  });
  if (!result) throw fail('Invalid credentials', 400);
  const token = setSession(res, result);
  res.set('Cache-Control', 'no-store').json({ token, mustChangePw: !!result.mustChangePw });
}));
router.get('/session', authenticateMentee, (req,res) => res.set('Cache-Control','no-store').json({role:'MENTEE',mustChangePw:!!req.mentee.mustChangePw}));
router.post('/session/migrate', authenticateMentee, (req,res) => {setSession(res,req.mentee);res.json({ok:true,mustChangePw:!!req.mentee.mustChangePw});});
router.delete('/session', sameOrigin, (_req,res) => res.clearCookie('tn_mentee',cookieOptions).json({ok:true}));
router.post('/change-password', authenticateMentee, rateLimit({ limit: 10 }), wrap(async (req, res) => {
  const newPassword = req.body.newPassword;
  if (typeof newPassword !== 'string' || newPassword.length < 10 || Buffer.byteLength(newPassword) > 72) throw fail('Use at least 10 characters and no more than 72 bytes.');
  const hash = await bcrypt.hash(newPassword, 12);
  const mentee = await mongoose.connection.transaction(async session => {
    const account = await Mentee.findById(req.mentee._id).session(session);
    if ((account.authVersion || 0) !== (req.mentee.authVersion || 0)) throw fail('Sign in again before changing your password.', 401);
    if (!demoEnabled() && !(await passwordMatches(req.body.currentPassword, account.password))) throw fail('Your current password is incorrect.');
    if (await passwordMatches(newPassword, account.password)) throw fail('Choose a different password from your current one.');
    account.password = hash; account.mustChangePw = false; account.failedLogins = 0; account.lockedUntil = undefined; account.authVersion = (account.authVersion || 0)+1; await account.save({ session });
    await Audit.create([{ actor: `MENTEE:${account._id}`, action: 'PASSWORD_CHANGED', target: String(account._id) }], { session });
    return account;
  });
  const token=setSession(res,mentee);
  res.set('Cache-Control', 'no-store').json({ token, ok: true });
}));
router.get('/dashboard', authenticateMentee, wrap(async (req,res) => {
  const mentee=await Mentee.findById(req.mentee._id).populate({path:'programs',populate:{path:'resources',match:{publishedAt:{$ne:null}}}}).populate('completedResources.resource');
  const completions=mentee.completedResources.filter(c=>c.resource?.publishedAt && mentee.programs.some(p=>p && String(p._id)===String(c.resource.program)));
  const map=new Map(completions.map(c=>[String(c.resource._id),c]));
  const resources=mentee.programs.filter(Boolean).flatMap(p=>p.resources.filter(Boolean));
  const [enrollments,quizzes]=await Promise.all([Enrollment.find({mentee:mentee._id}).lean(),Quiz.find({resource:{$in:resources.filter(r=>r.type==='quiz').map(r=>r._id)}}).select('resource startTime').lean()]);
  const programs=await Promise.all(mentee.programs.filter(Boolean).map(async p=>{
    const board=await cohortBoard(p._id,mentee._id);
    const items=p.resources.filter(Boolean).sort((a,b)=>a.deadline-b.deadline).map(r=>resourceView(r,map.get(String(r._id)),quizzes.find(q=>String(q.resource)===String(r._id))));
    return {_id:p._id,name:p.name,cohort:p.cohort,status:p.status,archived:!!p.archived,enrollmentNumber:enrollments.find(e=>String(e.program)===String(p._id))?.enrollmentNumber||mentee.enrollmentNumber,
      resources:items,rank:board.you?.rank||null,totalScore:items.reduce((sum,r)=>sum+(r.score||0),0),streak:streakFor(completions.filter(c=>String(c.resource.program)===String(p._id)))};
  }));
  res.set('Cache-Control','no-store').json({_id:mentee._id,name:mentee.name,email:mentee.email,enrollmentNumber:mentee.enrollmentNumber,showOnBoard:mentee.showOnBoard!==false,lastLoginAt:mentee.lastLoginAt,
    totalScore:completions.reduce((sum,c)=>sum+(c.score||0),0),streak:streakFor(completions),programs,
    completedResources:completions.map(c=>({title:c.resource.title,type:c.resource.type,completedOn:c.completedOn,score:c.score,feedback:c.feedback,verified:c.verified}))});
}));
router.get('/resources/:id',authenticateMentee,wrap(async(req,res)=>{
  if(!validId(req.params.id))throw fail('Resource not found.',404);
  const resource=await Resource.findOne({_id:req.params.id,publishedAt:{$ne:null},program:{$in:req.mentee.programs}});
  if(!resource)throw fail('Resource not found.',404);
  const completion=req.mentee.completedResources.find(c=>c.resource.equals(resource._id));
  const quiz=resource.type==='quiz'?await Quiz.findOne({resource:resource._id}).select('startTime'):null;
  res.set('Cache-Control','no-store').json(resourceView(resource,completion,quiz));
}));
router.get('/programs/:id/leaderboard',authenticateMentee,wrap(async(req,res)=>{
  if(!validId(req.params.id)||!req.mentee.programs.some(p=>p.equals(req.params.id)))throw fail('Program not found.',404);
  res.set('Cache-Control','private, no-store').json(await cohortBoard(req.params.id,req.mentee._id,req.query.period||'all'));
}));
router.patch('/profile',authenticateMentee,wrap(async(req,res)=>{
  if(Object.keys(req.body).some(k=>!['name','showOnBoard'].includes(k)))throw fail('Only your name and leaderboard visibility can be updated here.');
  const changes={};if(req.body.name!==undefined)changes.name=text(req.body.name,2,80,'Name');
  if(req.body.showOnBoard!==undefined){if(typeof req.body.showOnBoard!=='boolean')throw fail('Choose a valid visibility setting.');changes.showOnBoard=req.body.showOnBoard;}
  await mongoose.connection.transaction(async session=>{await Mentee.updateOne({_id:req.mentee._id},{$set:changes},{session});await Audit.create([{actor:`MENTEE:${req.mentee._id}`,action:'PROFILE_UPDATED',target:String(req.mentee._id),meta:{showOnBoard:req.body.showOnBoard}}],{session});});
  invalidateBoards();res.json({ok:true});
}));
async function submissionContext(req, session, resourceId) {
  if (!validId(resourceId)) throw fail('Resource not found.', 404);
  const resource = await Resource.findOne({ _id: resourceId, publishedAt: { $ne: null }, program: { $in: req.mentee.programs } }).session(session);
  const mentee = await Mentee.findById(req.mentee._id).session(session);
  if (!resource || !mentee.programs.some(p => p.equals(resource.program))) throw fail('Resource not found.', 404);
  if (mentee.mustChangePw || (mentee.authVersion||0) !== (req.mentee.authVersion||0)) throw fail('Sign in again and change your initial password.', 401);
  if (resource.isLocked) throw fail('This resource is locked.', 403);
  if (new Date() > resource.deadline) throw fail('The deadline has passed.', 403);
  return { resource, mentee };
}
const submissionsLimit = rateLimit({ limit: 60 });
router.post('/resources/:id/complete', authenticateMentee, submissionsLimit, wrap(async (req, res) => {
  const score = await mongoose.connection.transaction(async session => {
    const { resource, mentee } = await submissionContext(req, session, req.params.id);
    if (resource.type !== 'video') throw fail('Use the quiz or project submission form for this resource.');
    if (mentee.completedResources.some(c => c.resource.equals(resource._id))) throw fail('This video is already completed.', 409);
    mentee.completedResources.push({ resource: resource._id, score: resource.maxScore, completedOn: new Date(), scoredOn: new Date(), verified: true });
    refreshProgress(mentee); await mentee.save({ session }); resource.revision++; await resource.save({ session }); await Audit.create([{actor:`MENTEE:${mentee._id}`,action:'VIDEO_COMPLETED',target:String(resource._id),meta:{programId:String(resource.program)}}],{session}); return resource.maxScore;
  });
  invalidateBoards();res.json({ message: 'Video completed.', score });
}));
router.get('/resources/:id/quiz', authenticateMentee, wrap(async (req, res) => {
  if (!validId(req.params.id)) throw fail('Quiz not found.', 404);
  const resource = await Resource.findOne({ _id: req.params.id, type: 'quiz', publishedAt: { $ne: null }, program: { $in: req.mentee.programs } });
  if (!resource || !req.mentee.programs.some(p => p.equals(resource.program))) throw fail('Quiz not found.', 404);
  const quiz = await Quiz.findOne({ resource: resource._id });
  const now = new Date();
  if (!quiz || resource.isLocked || now < quiz.startTime || now > quiz.endTime || now > resource.deadline) throw fail('The quiz is not open at this time.', 403);
  res.json({ title: resource.title, description: resource.description, deadline: resource.deadline,
    questions: quiz.questions.map(q => ({ id: q._id, questionText: q.questionText, options: q.options, marks: q.marks })) });
}));
router.post('/resources/:id/quiz/submit', authenticateMentee, submissionsLimit, wrap(async (req, res) => {
  const answers = req.body.answers;
  if (!Array.isArray(answers) || answers.length > 50) throw fail('Submit a valid list of quiz answers.');
  const score = await mongoose.connection.transaction(async session => {
    const { resource, mentee } = await submissionContext(req, session, req.params.id);
    if (resource.type !== 'quiz') throw fail('Quiz not found.', 404);
    const quiz = await Quiz.findOne({ resource: resource._id }).session(session);
    if (!quiz || new Date() < quiz.startTime || new Date() > quiz.endTime) throw fail('The quiz is not open at this time.', 403);
    if (mentee.completedResources.some(c => c.resource.equals(resource._id))) throw fail('Quiz already submitted.', 409);
    if (new Set(answers.map(a => a.questionId)).size !== answers.length) throw fail('Each question can have only one answer.');
    for (const a of answers) { const q = quiz.questions.find(q => String(q._id) === a.questionId); if (!q || !Number.isInteger(a.selectedOptionIndex) || a.selectedOptionIndex < 0 || a.selectedOptionIndex >= q.options.length) throw fail('An answer has an invalid question or option.'); }
    const score = quiz.questions.reduce((sum,q) => sum+(answers.find(a => a.questionId === String(q._id))?.selectedOptionIndex === q.correctOptionIndex ? q.marks : 0), 0);
    await QuizSubmission.create([{ quiz: quiz._id, resource: resource._id, mentee: mentee._id, answers, score }], { session });
    mentee.completedResources.push({ resource: resource._id, score, completedOn: new Date(), scoredOn: new Date(), verified: true });
    refreshProgress(mentee); await mentee.save({ session }); resource.revision++; await resource.save({ session }); await Audit.create([{actor:`MENTEE:${mentee._id}`,action:'QUIZ_SUBMITTED',target:String(resource._id),meta:{programId:String(resource.program)}}],{session}); return score;
  });
  invalidateBoards();res.json({ message: 'Quiz submitted.', score });
}));
router.post('/resources/:resourceId/project', authenticateMentee, submissionsLimit, wrap(async (req, res) => {
  const githubLink=projectUrl(req.body.githubLink),deployedLink=projectUrl(req.body.deployedLink);
  if(!githubLink&&!deployedLink)throw fail('Add a repository or live demo link.');
  const description=text(req.body.description||'',0,2000,'Submission note');
  await mongoose.connection.transaction(async session=>{
    const {resource,mentee}=await submissionContext(req,session,req.params.resourceId);
    if(resource.type!=='project')throw fail('Project not found.',404);
    const existing=mentee.completedResources.find(c=>c.resource.equals(resource._id));
    if(existing?.verified)throw fail('This project has been graded and can no longer be edited.',409);
    const now=new Date();
    if(existing){existing.githubLink=githubLink;existing.deployedLink=deployedLink;existing.description=description;existing.submittedOn=now;if(!existing.submissionDates.length)existing.submissionDates.addToSet(existing.completedOn);existing.submissionDates.addToSet(new Date(Math.floor((+now+19800000)/86400000)*86400000-19800000));}
    else mentee.completedResources.push({resource:resource._id,githubLink,deployedLink,description,score:0,submittedOn:now,completedOn:now,submissionDates:[now],verified:false});
    refreshProgress(mentee);await mentee.save({session});resource.revision++;await resource.save({session});
    await Audit.create([{actor:`MENTEE:${mentee._id}`,action:existing?'PROJECT_RESUBMITTED':'PROJECT_SUBMITTED',target:String(resource._id),meta:{programId:String(resource.program)}}],{session});
  });
  invalidateBoards();res.json({message:'Project saved for mentor review.',score:0});
}));
router.get('/resources/:id/quiz/review',authenticateMentee,wrap(async(req,res)=>{
  if(!validId(req.params.id))throw fail('Quiz not found.',404);
  const resource=await Resource.findOne({_id:req.params.id,type:'quiz',publishedAt:{$ne:null},program:{$in:req.mentee.programs}});
  if(!resource)throw fail('Quiz not found.',404);
  const submission=await QuizSubmission.findOne({resource:resource._id,mentee:req.mentee._id}).lean();
  if(!submission)throw fail('Submit this quiz to see your review.',404);
  if(new Date()<=resource.deadline)throw fail('Answer review opens after the quiz deadline.',403);
  const quiz=await Quiz.findOne({resource:resource._id});
  res.set('Cache-Control','no-store').json({title:resource.title,score:submission.score,maxScore:resource.maxScore,questions:quiz.questions.map(q=>{
    const answer=submission.answers.find(a=>String(a.questionId)===String(q._id));
    return {id:q._id,questionText:q.questionText,options:q.options,marks:q.marks,yourAnswer:answer?q.options[answer.selectedOptionIndex]:null,correctAnswer:q.options[q.correctOptionIndex]};
  })});
}));
// --- Public Leaderboard --- //
// --- Public Leaderboard (same calc as dashboard) --- //
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const skip  = Math.max(parseInt(req.query.skip  || '0', 10), 0);

    // Compute totalScore = sum(completedResources.score)
    const rows = await Mentee.aggregate([
      { $match: { showOnBoard: { $ne: false } } },
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
      name: publicName(m.name),
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

  const token = req.get('x-auth-token') || readCookie(req,'tn_mentee');
  let viewerId;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (!decoded.role || decoded.role === 'MENTEE') {
        const account = await Mentee.findById(decoded.id).select('authVersion mustChangePw');
        if (account && !account.mustChangePw && (account.authVersion || 0) === (decoded.ver || 0)) viewerId = String(account._id);
      }
    } catch {
      // The standings are public. Expired sessions simply omit the personal card.
    }
  }

  try {
    const mentees = await Mentee.find()
      .select('name showOnBoard programs streak completedResources.resource completedResources.score completedResources.completedOn completedResources.scoredOn completedResources.verified completedResources.submissionDates')
      .populate('programs', 'name')
      .populate('completedResources.resource', 'type program maxScore')
      .lean();
    res.set('Cache-Control', 'private, no-store');
    if (mentees.length === 0) {
      const query = search.trim().toLocaleLowerCase('en-IN');
      const rows = originalLeaderboard.rows.map((row) => ({
        id: `original-${row.rank}`, name: row.name, rank: row.rank,
        score: row.totalScore, streak: row.streak, tracks: [],
        badges: [], movement: null, isYou: false,
      }));
      return res.json({
        updatedAt: originalLeaderboard.capturedAt,
        source: originalLeaderboard.source,
        sourceLabel: 'Original TechNeeds leaderboard',
        snapshot: true,
        leaderScore: rows[0]?.score || 0,
        total: rows.length,
        rows: rows.filter((row) => row.name.toLocaleLowerCase('en-IN').includes(query)),
        you: null,
      });
    }
    res.json(buildStandings(mentees, { period, track, search: search.trim().slice(0, 80), viewerId, now: new Date() }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load the leaderboard' });
  }
});

router.use(errors);
module.exports = router;
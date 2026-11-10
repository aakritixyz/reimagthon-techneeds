const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {demoEnabled,DEMO_MENTOR_ID}=require('../services/demoMode');
const { invalidateBoards } = require('../services/menteeLearning');
const { randomInt } = require('node:crypto');
const { authenticate } = require('../middleware/authMentor');
const { sameOrigin } = require('../middleware/authAdmin');
const rateLimit = require('../middleware/rateLimit');
const Program = require('../models/Program');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const Enrollment = require('../models/Enrollment');
const Resource = require('../models/Resource');
const Quiz = require('../models/Quiz');
const Audit = require('../models/AuditLog');
const { fail, validId, text, integer, scope, touch, audit, pagination, resourceData, errors, wrap } = require('../services/mentor');
const router = express.Router(), legacy = express.Router();
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const password = () => Array.from({ length: 14 }, () => alphabet[randomInt(alphabet.length)]).join('');
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/api' };
function setSession(res, mentor) {
  const token = jwt.sign({ id: mentor._id, role: 'MENTOR' }, process.env.JWT_SECRET, { audience: 'techneeds-mentor', expiresIn: '8h' });
  res.cookie('tn_mentor', token, { ...cookieOptions, maxAge: 8 * 3600000 });
}
router.post('/session', sameOrigin, rateLimit({ limit: 60 }), rateLimit({ limit: 10, key: req => req.ip + '|' + String(req.body.email || '').toLowerCase().slice(0, 254) }), wrap(async (req, res) => {
  const { email, password: supplied } = req.body;
  const mentor = demoEnabled() ? await Mentor.findById(DEMO_MENTOR_ID) : typeof email === 'string' ? await Mentor.findOne({ email: email.trim().toLowerCase() }) : null;
  if (!mentor || (!demoEnabled() && (typeof supplied !== 'string' || !(await bcrypt.compare(supplied, mentor.password))))) throw fail('Invalid email or password.', 401);
  setSession(res, mentor); res.json({ ok: true });
}));
router.delete('/session', sameOrigin, (_req, res) => res.clearCookie('tn_mentor', cookieOptions).json({ ok: true }));
router.use(authenticate);
router.post('/session/migrate', (req, res) => { setSession(res, req.mentor); res.json({ ok: true }); });
router.get('/workspace', wrap(async (req, res) => {
  const programs = await Program.find({ mentors: req.mentor._id }).sort({ archived: 1, createdAt: -1 }).lean();
  const ids = programs.map(p => p._id);
  const [mentees, resources] = await Promise.all([Mentee.find({ programs: { $in: ids } }).select('programs completedResources').lean(), Resource.find({ program: { $in: ids } }).select('title type deadline publishedAt program').lean()]);
  res.set('Cache-Control', 'no-store').json({ mentor: { _id: req.mentor._id, name: req.mentor.name, email: req.mentor.email }, programs: programs.map(p => {
    const cohort = mentees.filter(m => m.programs.some(id => String(id) === String(p._id)));
    const items = resources.filter(r => String(r.program) === String(p._id));
    const resourceIds = new Set(items.filter(r => r.type === 'project').map(r => String(r._id)));
    return { ...p, menteeCount: cohort.length, resourceCount: items.length,
      pendingGrading: cohort.reduce((sum, m) => sum + m.completedResources.filter(c => resourceIds.has(String(c.resource)) && c.submittedOn && !c.verified).length, 0),
      upcomingCount: items.filter(r => r.publishedAt && r.deadline > new Date()).length,
      upcoming: items.filter(r => r.publishedAt && r.deadline > new Date()).sort((a,b) => a.deadline-b.deadline).slice(0, 3) };
  }) });
}));
router.get('/programs/:programId/mentees', wrap(async (req, res) => {
  const program = await scope(req.mentor, req.params.programId);
  const { page, limit } = pagination(req.query);
  const search = String(req.query.search || '').trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const query = { programs: program._id, ...(search ? { $or: ['name','email','enrollmentNumber'].map(field => ({ [field]: { $regex: search, $options: 'i' } })) } : {}) };
  const [mentees, total, resources] = await Promise.all([Mentee.find(query).select('-password').sort({ name: 1, _id: 1 }).skip((page-1)*limit).limit(limit).lean(), Mentee.countDocuments(query), Resource.find({ program: program._id, publishedAt: { $ne: null } }).select('_id').lean()]);
  const enrollments = await Enrollment.find({ program: program._id, mentee: { $in: mentees.map(m => m._id) } }).lean();
  const resourceIds = new Set(resources.map(r => String(r._id)));
  res.json({ rows: mentees.map(m => ({ _id: m._id, name: m.name, email: m.email, mustChangePw: m.mustChangePw,
    enrollmentNumber: enrollments.find(e => String(e.mentee) === String(m._id))?.enrollmentNumber || m.enrollmentNumber,
    completed: m.completedResources.filter(c => resourceIds.has(String(c.resource))).length, totalResources: resources.length,
    score: m.completedResources.filter(c => resourceIds.has(String(c.resource))).reduce((s,c) => s+(c.score||0), 0) })), total, page, pages: Math.ceil(total/limit) });
}));
async function enroll(req, res) {
  const programId = req.params.programId || req.body.programId;
  await scope(req.mentor, programId, null, true);
  const input = req.body.mentees || [{ name: req.body.name, email: req.body.email }];
  if (!Array.isArray(input) || !input.length || input.length > 200) throw fail('Add 1–200 mentees per batch.');
  const seen = new Set();
  const rows = input.map((row, i) => {
    const name = text(row.name, 2, 80, `Row ${i+1} name`), email = text(row.email, 3, 254, `Row ${i+1} email`).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(`Row ${i+1}: enter a valid email.`);
    if (seen.has(email)) throw fail(`Row ${i+1}: duplicate email in this batch.`);
    seen.add(email); return { name, email };
  });
  // Password work happens before the transaction; retries return only the final committed result.
  const existing = await Mentee.find({ email: { $in: rows.map(r => r.email) } }).select('email').lean();
  const prepared = new Map();
  for (const row of rows) if (!existing.some(m => m.email === row.email)) { const value = password(); prepared.set(row.email, { password: value, hash: await bcrypt.hash(value, 12) }); }
  const credentials = await mongoose.connection.transaction(async session => {
    const program = await scope(req.mentor, programId, session, true);
    const count = await Mentee.countDocuments({ programs: program._id }).session(session);
    if (count + rows.length > (program.maxMentees ?? 30)) throw fail('This batch would exceed the program’s mentee capacity.', 409);
    program.code ||= `${program.name.replace(/[^A-Za-z]/g, '').slice(0,3).toUpperCase() || 'TN'}${String(program._id).slice(-6).toUpperCase()}`;
    const output = [];
    for (const row of rows) {
      let mentee = await Mentee.findOne({ email: row.email }).session(session);
      if (mentee?.programs.some(p => p.equals(program._id))) throw fail(`${row.email} is already enrolled in this program.`, 409);
      program.enrollmentSeq = (program.enrollmentSeq || 0) + 1;
      const enrollmentNumber = `TN${String(new Date().getUTCFullYear()).slice(2)}-${program.code}-${String(program.enrollmentSeq).padStart(4,'0')}`;
      const isNew = !mentee;
      if (isNew) {
        const secret = prepared.get(row.email);
        if (!secret) throw fail('An account changed during enrolment. Please retry.', 409);
        [mentee] = await Mentee.create([{ ...row, enrollmentNumber, password: secret.hash, programs: [program._id], mustChangePw: true, createdBy: req.mentor._id }], { session });
      } else { mentee.programs.addToSet(program._id); await mentee.save({ session }); }
      await Enrollment.create([{ mentee: mentee._id, program: program._id, enrollmentNumber }], { session });
      output.push({ _id: mentee._id, name: mentee.name, email: mentee.email, enrollmentNumber, existingAccount: !isNew,
        ...(isNew ? { password: prepared.get(row.email).password } : {}) });
    }
    await touch(program, session); await audit(req.mentor, 'MENTEES_ENROLLED', program._id, session, { count: rows.length });
    return output;
  });
  res.set('Cache-Control', 'no-store').status(201).json({ credentials, ...(credentials.length === 1 ? { mentee: { _id: credentials[0]._id, name: credentials[0].name, enrollmentNumber: credentials[0].enrollmentNumber }, tempPassword: credentials[0].password } : {}) });
}
const credentialLimiter = rateLimit({ limit: 15 });
router.post('/programs/:programId/mentees', credentialLimiter, wrap(enroll));
router.post('/programs/:programId/mentees/:menteeId/reset-password', rateLimit({ limit: 10 }), wrap(async (req, res) => {
  if (!validId(req.params.menteeId)) throw fail('Mentee not found.', 404);
  const secret = password(), hash = await bcrypt.hash(secret, 12);
  const result = await mongoose.connection.transaction(async session => {
    const program = await scope(req.mentor, req.params.programId, session, true);
    const mentee = await Mentee.findOne({ _id: req.params.menteeId, programs: program._id }).session(session);
    if (!mentee) throw fail('Mentee not found in this program.', 404);
    mentee.password = hash; mentee.mustChangePw = true; mentee.failedLogins = 0; mentee.lockedUntil = undefined; mentee.authVersion = (mentee.authVersion || 0) + 1; await mentee.save({ session });
    const enrollment = await Enrollment.findOne({ mentee: mentee._id, program: program._id }).session(session);
    await touch(program, session); await audit(req.mentor, 'MENTEE_PASSWORD_RESET', mentee._id, session, { programId: String(program._id) });
    return { _id: mentee._id, name: mentee.name, email: mentee.email, enrollmentNumber: enrollment?.enrollmentNumber || mentee.enrollmentNumber, password: secret };
  });
  res.set('Cache-Control', 'no-store').json({ credentials: [result] });
}));
router.get('/programs/:programId/resources', wrap(async (req, res) => {
  const program = await scope(req.mentor, req.params.programId);
  const resources = await Resource.find({ program: program._id }).sort({ createdAt: -1 }).lean();
  const quizzes = await Quiz.find({ resource: { $in: resources.filter(r => r.type === 'quiz').map(r => r._id) } }).lean();
  const mentees = await Mentee.find({ programs: program._id }).select('completedResources').lean();
  res.json(resources.map(r => ({ ...r, questions: quizzes.find(q => String(q.resource) === String(r._id))?.questions,
    startTime: quizzes.find(q => String(q.resource) === String(r._id))?.startTime,
    submissions: mentees.filter(m => m.completedResources.some(c => String(c.resource) === String(r._id))).length,
    pending: mentees.filter(m => m.completedResources.some(c => String(c.resource) === String(r._id) && c.submittedOn && !c.verified)).length })));
}));
async function createResource(req, res) {
  const programId = req.params.programId || req.body.program;
  const { data, quiz } = resourceData(req.body);
  const result = await mongoose.connection.transaction(async session => {
    const program = await scope(req.mentor, programId, session, true);
    const [resource] = await Resource.create([{ ...data, program: program._id, addedBy: req.mentor._id, publishedAt: null }], { session });
    if (quiz) { const [created] = await Quiz.create([{ ...quiz, resource: resource._id }], { session }); resource.quiz = created._id; await resource.save({ session }); }
    program.resources.addToSet(resource._id); await touch(program, session);
    await audit(req.mentor, 'RESOURCE_DRAFT_CREATED', resource._id, session, { name: resource.title, type: resource.type });
    return resource;
  });
  res.status(201).json(result);
}
router.post('/programs/:programId/resources', wrap(createResource));
router.patch('/resources/:resourceId', wrap(async (req, res) => {
  if (!validId(req.params.resourceId)) throw fail('Resource not found.', 404);
  const result = await mongoose.connection.transaction(async session => {
    const resource = await Resource.findById(req.params.resourceId).session(session);
    if (!resource) throw fail('Resource not found.', 404);
    const program = await scope(req.mentor, resource.program, session, true);
    const hasSubmissions = await Mentee.exists({ 'completedResources.resource': resource._id }).session(session);
    if (hasSubmissions) {
      if (Object.keys(req.body).some(key => !['description','deadline'].includes(key))) throw fail('This resource has submissions. Only its description and deadline extension can change.', 409);
      if (req.body.description !== undefined) resource.description = text(req.body.description, 0, 1000, 'Description');
      if (req.body.deadline !== undefined) {
        const deadline = new Date(req.body.deadline);
        if (!Number.isFinite(+deadline) || deadline < resource.deadline) throw fail('You can extend the deadline, but cannot shorten it after submissions.');
        resource.deadline = deadline;
        if (resource.type === 'quiz') await Quiz.updateOne({ resource: resource._id }, { endTime: deadline }, { session });
      }
    } else {
      if (req.body.type !== resource.type) throw fail('Resource type cannot be changed. Create a new draft for a different type.');
      const { data, quiz } = resourceData(req.body, !!resource.publishedAt);
      Object.assign(resource, data);
      if (quiz) await Quiz.updateOne({ resource: resource._id }, { $set: quiz }, { session });
    }
    resource.revision++; await resource.save({ session }); await touch(program, session);
    await audit(req.mentor, 'RESOURCE_UPDATED', resource._id, session, { name: resource.title });
    return resource;
  });
  res.json(result);
}));
router.post('/resources/:resourceId/publish', wrap(async (req, res) => {
  if (!validId(req.params.resourceId)) throw fail('Resource not found.', 404);
  await mongoose.connection.transaction(async session => {
    const resource = await Resource.findById(req.params.resourceId).session(session);
    if (!resource) throw fail('Resource not found.', 404);
    const program = await scope(req.mentor, resource.program, session, true);
    if (resource.publishedAt) throw fail('This resource is already published.', 409);
    const quiz = resource.type === 'quiz' ? await Quiz.findOne({ resource: resource._id }).session(session) : null;
    resourceData({ ...resource.toObject(), ...(quiz ? { questions: quiz.questions.map(q => q.toObject()), startTime: quiz.startTime } : {}) }, true);
    resource.publishedAt = new Date(); resource.revision++; await resource.save({ session }); await touch(program, session);
    await audit(req.mentor, 'RESOURCE_PUBLISHED', resource._id, session, { name: resource.title });
  });
  res.json({ ok: true });
}));
router.get('/resources/:resourceId/submissions', wrap(async (req, res) => {
  if (!validId(req.params.resourceId)) throw fail('Resource not found.', 404);
  const resource = await Resource.findById(req.params.resourceId).lean();
  if (!resource) throw fail('Resource not found.', 404);
  await scope(req.mentor, resource.program);
  const { page, limit } = pagination(req.query);
  const pipeline = [{ $match: { programs: resource.program, 'completedResources.resource': resource._id } },
    { $unwind: '$completedResources' }, { $match: { 'completedResources.resource': resource._id } },
    { $project: { name: 1, email: 1, enrollmentNumber: 1, submission: '$completedResources', pending: { $cond: [{ $and: [{ $eq: [{ $literal: resource.type }, 'project'] }, { $ne: ['$completedResources.verified', true] }] }, 1, 0] } } },
    { $sort: { pending: -1, 'submission.submittedOn': 1, _id: 1 } }, { $facet: { rows: [{ $skip: (page-1)*limit }, { $limit: limit }], total: [{ $count: 'count' }] } }];
  const [result] = await Mentee.aggregate(pipeline);
  const total = result.total[0]?.count || 0;
  res.json({ resource, rows: result.rows, total, page, pages: Math.ceil(total/limit) });
}));
async function grade(req, res) {
  const menteeId = req.params.menteeId, resourceId = req.params.resourceId;
  if (!validId(menteeId) || !validId(resourceId)) throw fail('Submission not found.', 404);
  const feedback = text(req.body.feedback || '', 0, 1000, 'Feedback');
  await mongoose.connection.transaction(async session => {
    const resource = await Resource.findById(resourceId).session(session);
    if (!resource || resource.type !== 'project') throw fail('Only project submissions can be graded here.');
    const program = await scope(req.mentor, resource.program, session, true);
    const score = integer(req.body.score, 0, resource.maxScore, 'Score');
    const mentee = await Mentee.findOne({ _id: menteeId, programs: resource.program }).session(session);
    const submission = mentee?.completedResources.find(c => c.resource.equals(resource._id) && c.submittedOn);
    if (!submission) throw fail('Submission not found in this program.', 404);
    const previousScore = submission.verified ? submission.score : null;
    submission.score = score; submission.feedback = feedback; submission.verified = true; submission.scoredOn = new Date(); submission.gradedBy = req.mentor._id;
    mentee.totalScore = mentee.completedResources.reduce((sum,c) => sum+(c.score||0), 0); await mentee.save({ session });
    resource.revision++; await resource.save({ session }); await touch(program, session);
    await audit(req.mentor, 'PROJECT_GRADED', resource._id, session, { menteeId, previousScore, score });
  });
  invalidateBoards();res.json({ ok: true });
}
router.patch('/resources/:resourceId/submissions/:menteeId', wrap(grade));
router.get('/programs/:programId/activity', wrap(async (req, res) => {
  const program = await scope(req.mentor, req.params.programId);
  const resources = await Resource.find({ program: program._id }).select('_id').lean();
  const targets = [String(program._id), ...resources.map(r => String(r._id))];
  res.json(await Audit.find({ $or: [{ target: { $in: targets } }, { 'meta.programId': String(program._id) }] }).sort({ createdAt: -1 }).limit(50).lean());
}));
// Keep older integrations on the same validation, transactions, and scope checks.
legacy.post('/mentees', authenticate, credentialLimiter, wrap(enroll));
legacy.post('/resources', authenticate, wrap(createResource));
legacy.post('/resources/quiz', authenticate, (req, _res, next) => { req.body.type = 'quiz'; req.body.deadline ||= req.body.endTime; next(); }, wrap(createResource));
legacy.patch('/:menteeId/resources/:resourceId/verify', authenticate, wrap(grade));
router.use(errors); legacy.use(errors);
module.exports = { router, legacy };

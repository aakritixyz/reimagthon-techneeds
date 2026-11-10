const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createHash, randomBytes } = require('node:crypto');
const auth = require('../middleware/authAdmin');
const {demoEnabled}=require('../services/demoMode');
const rateLimit = require('../middleware/rateLimit');
const Program = require('../models/Program');
const Mentor = require('../models/Mentor');
const Invite = require('../models/MentorInvite');
const Proposal = require('../models/AllocationProposal');
const Audit = require('../models/AuditLog');
const { allocationSnapshot, solve } = require('../services/allocation');
const router = express.Router();
const onboarding = express.Router();
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const hash = token => createHash('sha256').update(token).digest('hex');
const id = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const statuses = ['DRAFT', 'OPEN', 'ACTIVE', 'CLOSED'];
const text = (value, min, max, label) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw fail(`${label} must be ${min}–${max} characters.`);
  return value.trim();
};
const integer = (value, min, max, label) => {
  if (!Number.isInteger(value) || value < min || value > max) throw fail(`${label} must be a whole number from ${min} to ${max}.`);
  return value;
};
function programData(body) {
  const name = text(body.name, 2, 80, 'Track name');
  const cohort = text(body.cohort, 2, 40, 'Cohort');
  const startDate = new Date(body.startDate), endDate = new Date(body.endDate);
  if (!Number.isFinite(+startDate) || !Number.isFinite(+endDate) || endDate <= startDate) throw fail('Choose valid dates, with the end after the start.');
  if (!statuses.includes(body.status)) throw fail('Choose a valid program status.');
  const minMentors = integer(body.minMentors, 0, 50, 'Minimum mentors');
  const maxMentors = integer(body.maxMentors, 1, 50, 'Maximum mentors');
  if (minMentors > maxMentors) throw fail('Minimum mentors cannot exceed the maximum.');
  return { name, cohort, description: text(body.description || '', 0, 500, 'Description'),
    startDate, endDate, maxMentees: integer(body.maxMentees, 1, 500, 'Mentee capacity'),
    minMentors, maxMentors, status: body.status,
    programKey: JSON.stringify([name.toLowerCase(), cohort.toLowerCase()]) };
}
const record = (action, target, session, meta) => Audit.create([{ action, target: String(target), meta }], { session });
async function transaction(fn) {
  return mongoose.connection.transaction(fn);
}
function inviteOutput(invite) {
  const { tokenHash, ...safe } = invite.toObject ? invite.toObject() : invite;
  return { ...safe, status: invite.usedAt ? 'ACCEPTED' : invite.revokedAt ? 'REVOKED' : +new Date(invite.expiresAt) <= Date.now() ? 'EXPIRED' : 'PENDING' };
}
function newToken() {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hash(token), expiresAt: new Date(Date.now() + 48 * 3600_000) };
}
function inviteUrl(token) {
  return `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/onboard#token=${token}`;
}
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/api/admin' };
router.post('/session', auth.sameOrigin, rateLimit(), wrap(async (req, res) => {
  if (!demoEnabled() && !auth.validKey(req.body.key)) throw fail('Invalid admin credentials.', 401);
  const token = jwt.sign({ role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '8h', audience: 'techneeds-admin' });
  res.cookie(auth.COOKIE, token, { ...cookieOptions, maxAge: 8 * 3600_000 }).json({ role: 'ADMIN' });
}));
router.delete('/session', auth.sameOrigin, (_req, res) => {
  res.clearCookie(auth.COOKIE, cookieOptions).json({ ok: true });
});
router.use(auth);
router.get('/workspace', wrap(async (_req, res) => {
  const [programs, mentors, invites, proposals, audit] = await Promise.all([
    Program.find().sort({ createdAt: -1 }).lean(), Mentor.find().select('-password').sort({ name: 1 }).lean(),
    Invite.find().sort({ createdAt: -1 }).lean(), Proposal.find().sort({ createdAt: -1 }).limit(15).lean(),
    Audit.find().sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  res.set('Cache-Control', 'no-store').json({ programs, mentors, invites: invites.map(inviteOutput), proposals, audit });
}));
router.post('/programs', wrap(async (req, res) => {
  const data = programData(req.body);
  const result = await transaction(async session => {
    if (await Program.exists({ name: data.name, cohort: data.cohort }).session(session)) throw fail('This track already exists for that cohort.', 409);
    const [program] = await Program.create([data], { session });
    await record('PROGRAM_CREATED', program._id, session, { name: data.name, cohort: data.cohort });
    return program;
  });
  res.status(201).json(result);
}));
router.patch('/programs/:id', wrap(async (req, res) => {
  if (!id(req.params.id)) throw fail('Invalid program.');
  const data = programData(req.body);
  const result = await transaction(async session => {
    const program = await Program.findById(req.params.id).session(session);
    if (!program) throw fail('Program not found.', 404);
    if (program.archived) throw fail('Restore this program before editing.', 409);
    if ((program.mentors || []).length > data.maxMentors) throw fail('Maximum mentors cannot be below the current assignment count.');
    Object.assign(program, data); await program.save({ session });
    await record('PROGRAM_UPDATED', program._id, session, { name: program.name, status: program.status });
    return program;
  });
  res.json(result);
}));
router.post('/programs/:id/archive', wrap(async (req, res) => {
  if (!id(req.params.id) || typeof req.body.archived !== 'boolean') throw fail('Choose a valid program and archive state.');
  await transaction(async session => {
    const program = await Program.findByIdAndUpdate(req.params.id, { archived: req.body.archived }, { session, new: true });
    if (!program) throw fail('Program not found.', 404);
    await record(req.body.archived ? 'PROGRAM_ARCHIVED' : 'PROGRAM_RESTORED', program._id, session, { name: program.name });
  });
  res.json({ ok: true });
}));
router.delete('/programs/:id/mentors/:mentorId', wrap(async (req, res) => {
  if (!id(req.params.id) || !id(req.params.mentorId)) throw fail('Invalid program or mentor.');
  await transaction(async session => {
    const program = await Program.findById(req.params.id).session(session);
    if (!program) throw fail('Program not found.', 404);
    await Program.updateOne({ _id: program._id }, { $pull: { mentors: req.params.mentorId } }, { session });
    await Mentor.updateOne({ _id: req.params.mentorId }, { $pull: { programs: program._id } }, { session });
    await record('MENTOR_REMOVED', program._id, session, { mentorId: req.params.mentorId });
  });
  res.json({ ok: true });
}));
router.patch('/mentors/:id', wrap(async (req, res) => {
  if (!id(req.params.id) || typeof req.body.approved !== 'boolean') throw fail('Invalid mentor settings.');
  const maxTracks = integer(req.body.maxTracks, 1, 10, 'Track limit');
  const seatsPerTrack = integer(req.body.seatsPerTrack, 1, 100, 'Seats per track');
  const scores = req.body.trackScores;
  if (!scores || typeof scores !== 'object' || Array.isArray(scores) || Object.keys(scores).length > 100) throw fail('Invalid application scores.');
  for (const [programId, score] of Object.entries(scores)) {
    if (!id(programId)) throw fail('Invalid track in application.');
    integer(score, 0, 100, 'Match score');
  }
  await transaction(async session => {
    const mentor = await Mentor.findById(req.params.id).session(session);
    if (!mentor) throw fail('Mentor not found.', 404);
    if ((mentor.programs || []).length > maxTracks) throw fail('Track limit cannot be below current assignments. Remove assignments first.');
    const validPrograms = await Program.countDocuments({ _id: { $in: Object.keys(scores) }, archived: { $ne: true } }).session(session);
    if (validPrograms !== Object.keys(scores).length) throw fail('An application refers to a missing or archived track.');
    Object.assign(mentor, { approved: req.body.approved, maxTracks, seatsPerTrack, trackScores: scores });
    await mentor.save({ session });
    await record('MENTOR_APPLICATION_UPDATED', mentor._id, session, { approved: mentor.approved });
  });
  res.json({ ok: true });
}));
router.post('/invites', wrap(async (req, res) => {
  const name = text(req.body.name, 2, 80, 'Mentor name');
  const email = text(req.body.email, 3, 254, 'Email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail('Enter a valid email address.');
  if (!Array.isArray(req.body.programIds)) throw fail('Choose valid programs.');
  const programIds = [...new Set(req.body.programIds)];
  if (programIds.length > 10 || programIds.some(value => !id(value))) throw fail('Select up to ten valid programs.');
  const secret = newToken();
  const result = await transaction(async session => {
    if (await Mentor.exists({ email }).session(session)) throw fail('This mentor already has an account. Configure their application instead.', 409);
    const valid = await Program.countDocuments({ _id: { $in: programIds }, archived: { $ne: true }, status: { $ne: 'CLOSED' } }).session(session);
    if (valid !== programIds.length) throw fail('Choose programs that are open for onboarding.');
    await Invite.updateMany({ email, usedAt: null, revokedAt: null }, { revokedAt: new Date() }, { session });
    const [invite] = await Invite.create([{ name, email, programIds, tokenHash: secret.tokenHash, expiresAt: secret.expiresAt }], { session });
    await record('MENTOR_INVITED', invite._id, session, { email, programIds });
    return inviteOutput(invite);
  });
  res.status(201).json({ invite: result, inviteUrl: inviteUrl(secret.token), delivery: 'COPY_LINK' });
}));
router.post('/invites/:id/:action', wrap(async (req, res) => {
  if (!id(req.params.id) || !['resend', 'revoke'].includes(req.params.action)) throw fail('Invalid invitation action.');
  const secret = newToken();
  await transaction(async session => {
    const invite = await Invite.findById(req.params.id).session(session);
    if (!invite) throw fail('Invitation not found.', 404);
    if (invite.usedAt) throw fail('This invitation has already been accepted.', 409);
    if (req.params.action === 'revoke') invite.revokedAt = new Date();
    else {
      if (await Mentor.exists({ email: invite.email }).session(session)) throw fail('This mentor already has an account.', 409);
      invite.tokenHash = secret.tokenHash; invite.expiresAt = secret.expiresAt; invite.revokedAt = undefined;
    }
    await invite.save({ session });
    await record(req.params.action === 'revoke' ? 'INVITE_REVOKED' : 'INVITE_REISSUED', invite._id, session);
  });
  res.json({ ok: true, ...(req.params.action === 'resend' ? { inviteUrl: inviteUrl(secret.token), delivery: 'COPY_LINK' } : {}) });
}));
let solverBusy = false;
router.post('/allocations/suggest', wrap(async (req, res) => {
  if (solverBusy) throw fail('Another allocation is running. Please try again shortly.', 409);
  solverBusy = true;
  try {
    const snapshot = await allocationSnapshot();
    if (!snapshot.input.tracks.length) throw fail('Create a non-archived cohort before generating a plan.');
    if (snapshot.input.mentors.length > 100 || snapshot.input.tracks.length > 100) throw fail('Limit allocation to 100 mentors and 100 active tracks.');
    const pairs = label => {
      const values = req.body[label] || [];
      if (!Array.isArray(values) || values.length > 10000 || values.some(p => !Array.isArray(p) || p.length !== 2 || !id(p[0]) || !id(p[1]))) throw fail(`Invalid ${label} pairs.`);
      for (const [mid, tid] of values) if (!snapshot.input.mentors.some(m => m.id === mid && Object.hasOwn(m.scores, tid))) throw fail('Each rule must refer to an approved mentor application.');
      return values;
    };
    const input = { ...snapshot.input, locked: pairs('locked'), banned: pairs('banned'), time_limit: 10 };
    const plan = await solve(input);
    const proposal = await transaction(async session => {
      const [created] = await Proposal.create([{ fingerprint: snapshot.fingerprint, input, plan }], { session });
      await record('ALLOCATION_SUGGESTED', created._id, session, { status: plan.status, gaps: plan.gaps.length, firstChoiceCount: plan.firstChoiceCount || 0 });
      return created;
    });
    res.status(201).json(proposal);
  } finally { solverBusy = false; }
}));
router.post('/allocations/:id/apply', wrap(async (req, res) => {
  if (!id(req.params.id)) throw fail('Invalid allocation draft.');
  await transaction(async session => {
    const proposal = await Proposal.findById(req.params.id).session(session);
    if (!proposal || proposal.state !== 'DRAFT') throw fail('This draft is missing or has already been applied.', 409);
    if (!['OPTIMAL', 'FEASIBLE'].includes(proposal.plan.status)) throw fail('This plan has no valid solution. Adjust its rules and rerun.');
    if (proposal.plan.gaps.length && req.body.confirmGaps !== true) throw fail('Review and acknowledge the staffing gaps before applying.');
    const current = await allocationSnapshot(session);
    if (current.fingerprint !== proposal.fingerprint) throw fail('Programs, mentors, or enrolments changed. Generate a fresh draft before applying.', 409);
    const scope = proposal.input.tracks.map(t => t.id);
    for (const programId of scope) {
      await Program.updateOne({ _id: programId }, { $set: { mentors: proposal.plan.assignments[programId] || [] } }, { session });
    }
    // Preserve assignments outside this draft, synchronize both sides in the same transaction.
    const allMentors = await Mentor.find().session(session);
    for (const mentor of allMentors) {
      mentor.programs = [...mentor.programs.filter(p => !scope.includes(String(p))),
        ...scope.filter(pid => (proposal.plan.assignments[pid] || []).includes(String(mentor._id)))];
      await mentor.save({ session });
    }
    proposal.state = 'APPLIED'; proposal.appliedAt = new Date(); await proposal.save({ session });
    await record('ALLOCATION_APPLIED', proposal._id, session, { gaps: proposal.plan.gaps.length, matches: proposal.plan.matches });
  });
  res.json({ ok: true });
}));

onboarding.use(rateLimit({ limit: 20 }));
onboarding.post('/', auth.sameOrigin, wrap(async (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || !/^[a-f\d]{64}$/.test(token)) throw fail('Invalid or expired invitation.');
  if (typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 72) throw fail('Choose a password with at least 10 characters and at most 72 bytes.');
  const passwordHash = await bcrypt.hash(password, 12);
  await transaction(async session => {
    const invite = await Invite.findOne({ tokenHash: hash(token), usedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } }).session(session);
    if (!invite) throw fail('Invalid or expired invitation.');
    if (await Mentor.exists({ email: invite.email }).session(session)) throw fail('This invitation cannot be used. Contact your admin.');
    const programs = await Program.find({ _id: { $in: invite.programIds }, archived: { $ne: true }, status: { $ne: 'CLOSED' } }).session(session);
    if (programs.length !== invite.programIds.length) throw fail('An invited program is no longer available. Ask your admin for a new invitation.');
    for (const program of programs) if (program.mentors.length >= (program.maxMentors ?? 5)) throw fail('An invited program has reached its mentor limit. Contact your admin.');
    const [mentor] = await Mentor.create([{ name: invite.name, email: invite.email, password: passwordHash, programs: invite.programIds,
      maxTracks: Math.max(2, invite.programIds.length) }], { session });
    for (const program of programs) { program.mentors.addToSet(mentor._id); await program.save({ session }); }
    invite.usedAt = new Date(); await invite.save({ session });
    await Audit.create([{ actor: 'MENTOR', action: 'INVITE_ACCEPTED', target: String(invite._id), meta: { mentorId: String(mentor._id) } }], { session });
  });
  res.status(201).json({ ok: true });
}));
function errors(error, _req, res, _next) {
  const status = error.status || (error.code === 11000 ? 409 : error.name === 'ValidationError' ? 400 : 500);
  const message = error.code === 11000 ? 'This record already exists.' : error.code === 20 ? 'MongoDB must run as a replica set for atomic admin operations. See backend/ADMIN_SETUP.md.' : status === 500 ? 'Unable to complete this operation. Please try again.' : error.message;
  if (status === 500) console.error('Admin operation failed:', error.name, error.code || '');
  res.status(status).json({ error: message });
}
router.use(errors); onboarding.use(errors);
module.exports = { router, onboarding };

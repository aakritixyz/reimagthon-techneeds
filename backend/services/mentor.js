const Program = require('../models/Program');
const Audit = require('../models/AuditLog');
const fail = (message, status = 400, code) => Object.assign(new Error(message), { status, code });
const validId = id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
const text = (value, min, max, name) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw fail(`${name} must be ${min}–${max} characters.`);
  return value.trim();
};
const integer = (value, min, max, name) => {
  if (!Number.isInteger(value) || value < min || value > max) throw fail(`${name} must be a whole number from ${min} to ${max}.`);
  return value;
};
function webUrl(value, name = 'Link', hosts) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (hosts && !hosts.includes(url.hostname.toLowerCase()))) throw new Error();
    if (String(value).length > 2000) throw new Error();
    return url.toString();
  } catch { throw fail(hosts ? 'Use a YouTube, Vimeo, or Google Drive video link.' : `${name} must be a valid HTTP or HTTPS URL.`); }
}
async function scope(mentor, programId, session, write = false) {
  if (!validId(String(programId))) throw fail('Program not found.', 404);
  const program = await Program.findOne({ _id: programId, mentors: mentor._id }).session(session || null);
  if (!program) throw fail('You are not assigned to this program.', 403);
  if (write && (program.archived || program.status === 'CLOSED')) throw fail('This program is closed or archived. Its history remains available.', 409);
  return program;
}
async function touch(program, session) { program.activityRevision = (program.activityRevision || 0) + 1; await program.save({ session }); }
const audit = (mentor, action, target, session, meta = {}) => Audit.create([{ actor: `MENTOR:${mentor._id}`, action, target: String(target), meta }], { session });
function pagination(query) {
  return { page: Math.max(1, Math.min(10000, Number.parseInt(query.page, 10) || 1)), limit: 25 };
}
function resourceData(body, publishing = false) {
  const type = body.type;
  if (!['video', 'quiz', 'project'].includes(type)) throw fail('Choose a video, quiz, or project.');
  const deadline = new Date(body.deadline);
  if (!Number.isFinite(+deadline) || (publishing && deadline <= new Date())) throw fail('Choose a valid deadline in the future before publishing.');
  const data = { title: text(body.title, 3, 120, 'Title'), type, description: text(body.description || '', 0, 1000, 'Description'), deadline };
  let quiz;
  if (type === 'quiz') {
    if (!Array.isArray(body.questions) || !body.questions.length || body.questions.length > 50) throw fail('A quiz needs 1–50 questions.');
    const questions = body.questions.map(q => {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) throw fail('Each question needs 2–6 options.');
      return { questionText: text(q.questionText, 3, 500, 'Question'), options: q.options.map(o => text(o, 1, 250, 'Option')),
        correctOptionIndex: integer(q.correctOptionIndex, 0, q.options.length - 1, 'Correct option'), marks: integer(q.marks, 1, 1000, 'Question points') };
    });
    data.maxScore = questions.reduce((sum, q) => sum + q.marks, 0);
    integer(data.maxScore, 1, 1000, 'Quiz total');
    const startTime = new Date(body.startTime);
    if (!Number.isFinite(+startTime) || startTime >= deadline) throw fail('The quiz opening time must be before its deadline.');
    quiz = { questions, startTime, endTime: deadline, revealScores: true };
  } else {
    data.maxScore = integer(body.maxScore, 1, 1000, 'Maximum score');
    if (type === 'video') data.url = webUrl(body.url, 'Video', ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'vimeo.com', 'www.vimeo.com', 'player.vimeo.com', 'drive.google.com']);
    else {
      data.instructions = text(body.instructions, 20, 10000, 'Project instructions');
      data.url = body.url ? webUrl(body.url, 'Reference link') : '';
    }
  }
  return { data, quiz };
}
function errors(error, _req, res, _next) {
  const status = error.status || (error.code === 11000 ? 409 : error.name === 'ValidationError' ? 400 : 500);
  if (status === 500) console.error('Mentorship operation failed:', error.name, error.code || '');
  res.status(status).json({ error: error.code === 11000 ? 'This account, enrolment, or submission already exists. Refresh and try again.' : status === 500 ? 'Unable to complete this operation. Please try again.' : error.message, ...(typeof error.code === 'string' ? { code: error.code } : {}) });
}
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
module.exports = { fail, validId, text, integer, webUrl, scope, touch, audit, pagination, resourceData, errors, wrap };

const { spawn } = require('node:child_process');
const path = require('node:path');
const { existsSync } = require('node:fs');
const { createHash } = require('node:crypto');
const Program = require('../models/Program');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');

async function allocationSnapshot(session) {
  const programs = await Program.find({ archived: { $ne: true }, status: { $ne: 'CLOSED' } }).sort('_id').session(session || null).lean();
  const mentors = await Mentor.find().select('-password').sort('_id').session(session || null).lean();
  const counts = await Mentee.aggregate([{ $unwind: '$programs' }, { $group: { _id: '$programs', count: { $sum: 1 } } }]).session(session || null);
  const scope = new Set(programs.map(p => String(p._id)));
  const input = {
    mentors: mentors.filter(m => m.approved).map(m => ({
      id: String(m._id), name: m.name,
      max_tracks: Math.max(0, (m.maxTracks ?? 2) - (m.programs || []).filter(id => !scope.has(String(id))).length),
      seats_per_track: m.seatsPerTrack ?? 8,
      scores: Object.fromEntries(Object.entries(m.trackScores || {}).filter(([id]) => scope.has(id))),
    })),
    tracks: programs.map(p => ({ id: String(p._id), name: p.name, cohort: p.cohort,
      min_mentors: p.minMentors ?? 1, max_mentors: p.maxMentors ?? 5,
      mentees: Math.max(p.maxMentees ?? 30, counts.find(c => String(c._id) === String(p._id))?.count || 0),
    })),
    previous: programs.flatMap(p => (p.mentors || []).map(id => [String(id), String(p._id)])),
  };
  const fingerprint = createHash('sha256').update(JSON.stringify({ programs, mentors, counts: counts.sort((a,b) => String(a._id).localeCompare(String(b._id))) })).digest('hex');
  return { input, fingerprint };
}

function solve(input) {
  const localPython = path.join(__dirname, '../solver/.venv/bin/python');
  const python = process.env.SOLVER_PYTHON || (existsSync(localPython) ? localPython : 'python3');
  return new Promise((resolve, reject) => {
    const worker = spawn(python, [path.join(__dirname, '../solver/assign.py')], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', stderr = '', finished = false;
    const finish = (error, result) => {
      if (finished) return;
      finished = true; clearTimeout(timer);
      error ? reject(error) : resolve(result);
    };
    const timer = setTimeout(() => { worker.kill('SIGKILL'); finish(new Error('Allocation timed out. Try fewer tracks or mentors.')); }, 35000);
    worker.on('error', () => finish(new Error('Solver unavailable. Install backend/solver/requirements.txt in backend/solver/.venv.')));
    worker.stdout.on('data', data => { output += data; if (output.length > 2_000_000) worker.kill('SIGKILL'); });
    worker.stderr.on('data', data => { stderr += data; });
    worker.on('close', code => {
      try {
        const result = JSON.parse(output);
        if (code) return finish(new Error(result.error || 'Allocation solver failed.'));
        finish(null, result);
      } catch {
        finish(new Error(stderr.includes('ortools') ? 'Install the OR-Tools solver dependencies first.' : 'Allocation solver did not return a valid plan.'));
      }
    });
    worker.stdin.on('error', () => {});
    worker.stdin.end(JSON.stringify(input));
  });
}
module.exports = { allocationSnapshot, solve };

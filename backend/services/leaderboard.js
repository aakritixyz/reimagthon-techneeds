const { publicName } = require('./menteeLearning');
const { streakFor } = require('./progress');
const day = 24 * 60 * 60 * 1000;
const ist = 330 * 60 * 1000;
const tracks = {
  web: /\bweb(?:site|sites)?\b/i,
  dsa: /\b(?:dsa|data structures?|algorithms?)\b/i,
  ml: /\b(?:machine learning|ai|ml|aiml)\b/i,
  arvr: /\b(?:ar|vr|xr|augmented reality|virtual reality)\b/i,
  app: /\b(?:app|mobile|android|ios)\b/i,
};

const periods = new Set(['all', 'month', 'week']);

function periodBounds(now, period) {
  const local = new Date(now.getTime() + ist);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - ist;
  const weekStart = midnight - ((local.getUTCDay() + 6) % 7) * day;
  const monthStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - ist;
  return {
    start: { all: -Infinity, month: monthStart, week: weekStart }[period],
    previousStart: { all: -Infinity, month: monthStart, week: weekStart - 7 * day }[period],
    previousEnd: weekStart,
  };
}

function rank(entries, start, end = Infinity) {
  return entries.map((entry) => {
    let score = 0;
    let latest = 0;
    for (const item of entry.scores) {
      // An older project grade can contribute to the lifetime total without
      // implying that we know the day on which it was awarded.
      if (!item.time && (start !== -Infinity || end !== Infinity)) continue;
      if (item.time && (item.time < start || item.time >= end)) continue;
      score += item.points;
      latest = Math.max(latest, item.time);
    }
    return { entry, score, latest };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.latest - a.latest || a.entry.id.localeCompare(b.entry.id));
}

function buildStandings(mentees, { period, track, search, viewerId, now }) {
  const matchTrack = tracks[track];
  const entries = mentees.filter(m => m.showOnBoard !== false || String(m._id) === viewerId).map((mentee) => {
    const programs = mentee.programs.filter(Boolean);
    const completions = mentee.completedResources ?? [];
    const scopes = programs.filter((program) => !matchTrack || matchTrack.test(program.name));
    const scopedIds = new Set(scopes.map((program) => String(program._id)));
    const scoped = matchTrack
      ? completions.filter((item) => scopedIds.has(String(item.resource?.program)))
      : completions;
    const streak = streakFor(completions, now);
    const badges = [];
    if (streak >= 7) badges.push(streak >= 30 ? '30-day streak' : streak >= 14 ? '14-day streak' : '7-day streak');
    if (scoped.some((item) => item.resource?.type === 'project' && item.verified)) badges.push('First project');
    if (scoped.some((item) => item.resource?.type === 'quiz' && item.score > 0 && item.score === item.resource.maxScore)) {
      badges.push('Perfect quiz');
    }
    return {
      id: String(mentee._id),
      name: publicName(mentee.name),
      visible: mentee.showOnBoard !== false,
      tracks: scopes.map((program) => program.name),
      streak,
      badges,
      scores: scoped.map((item) => ({
        points: item.score || 0,
        time: Number(item.scoredOn ?? (item.resource?.type === 'project' || item.verified ? 0 : item.completedOn)) || 0,
      })),
    };
  });

  const { start, previousStart, previousEnd } = periodBounds(now, period);
  const current = rank(entries.filter(e => e.visible), start);
  const previous = new Map(rank(entries.filter(e => e.visible), previousStart, previousEnd).map(({ entry }, index) => [entry.id, index + 1]));
  const standings = current.map(({ entry, score }, index) => {
    const rank = index + 1;
    return {
      id: entry.id, name: entry.name, tracks: entry.tracks, streak: entry.streak, badges: entry.badges,
      score, rank, movement: previous.has(entry.id) ? previous.get(entry.id) - rank : null,
      isYou: entry.id === viewerId,
    };
  });

  const viewer = entries.find((entry) => entry.id === viewerId);
  const you = standings.find((entry) => entry.isYou);
  const ahead = you && standings[you.rank - 2];
  const query = search.toLocaleLowerCase('en-IN');
  return {
    updatedAt: now.toISOString(),
    leaderScore: standings[0]?.score || 0,
    total: standings.length,
    rows: standings.filter((row) => row.name.toLocaleLowerCase('en-IN').includes(query)).slice(0, 200),
    you: viewer ? {
      rank: you?.rank ?? null,
      score: you?.score ?? viewer.scores.filter(s => !s.time || s.time >= start).reduce((sum,s) => sum+s.points,0),
      optedOut: !viewer.visible,
      pointsToPass: ahead ? Math.floor(ahead.score - you.score) + 1 : null,
    } : null,
  };
}

module.exports = { buildStandings, periods, tracks };

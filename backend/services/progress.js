const day = 86400000, ist = 19800000;
function streakFor(completions, now = new Date()) {
  const days = [...new Set(completions.flatMap(c => (c.submissionDates?.length ? c.submissionDates : [c.submittedOn || c.completedOn]).map(date => Math.floor((+new Date(date) + ist) / day))).filter(Number.isFinite))].sort((a,b) => b-a);
  const today = Math.floor((+now + ist) / day);
  if (!days.length || days[0] < today - 1 || days[0] > today) return 0;
  let count = 1;
  while (count < days.length && days[count] === days[count-1] - 1) count++;
  return count;
}
function refreshProgress(mentee) {
  mentee.totalScore = mentee.completedResources.reduce((sum, c) => sum + (c.score || 0), 0);
  mentee.streak = streakFor(mentee.completedResources);
  mentee.lastActiveDate = new Date();
}
module.exports = { streakFor, refreshProgress };

const Mentee = require('../models/Mentee');
const Resource = require('../models/Resource');
const { streakFor } = require('./progress');
const { fail, webUrl } = require('./mentor');
const cache = new Map();
const invalidateBoards = () => cache.clear();
function publicName(name) { const parts = String(name).trim().split(/\s+/); return parts[0] + (parts.length > 1 ? ' '+parts.at(-1)[0]+'.' : ''); }
function resourceView(resource, completion, quiz, now = new Date()) {
  const completed = !!completion;
  const verified = completed && (resource.type !== 'project' || !!completion.verified);
  const status = completed ? verified ? 'GRADED' : 'SUBMITTED' : resource.deadline < now ? 'MISSED' : 'PENDING';
  return { _id: resource._id, program: resource.program, title: resource.title, type: resource.type, description: resource.description || '',
    instructions: resource.instructions || '', url: resource.url || '', deadline: resource.deadline, maxScore: resource.maxScore,
    isLocked: !!resource.isLocked, startTime: quiz?.startTime || null, status, completed, verified,
    score: verified ? completion.score : null, feedback: completion?.feedback || '', submittedOn: completion?.submittedOn || completion?.completedOn || null,
    completedOn: completion?.completedOn || null, scoredOn: completion?.scoredOn || null,
    submission: resource.type === 'project' && completion ? { githubLink: completion.githubLink || '', deployedLink: completion.deployedLink || '', description: completion.description || '' } : null };
}
function projectUrl(value) {
  if (!value) return '';
  const url = webUrl(value, 'Project link');
  const host = new URL(url).hostname.toLowerCase();
  const exact = ['github.com','www.github.com','gitlab.com','www.gitlab.com','bitbucket.org','drive.google.com','www.figma.com','figma.com','codepen.io','codesandbox.io','stackblitz.com','replit.com','www.notion.so','notion.so'];
  const suffixes = ['vercel.app','netlify.app','github.io','pages.dev','onrender.com','web.app','firebaseapp.com','glitch.me','replit.app'];
  if (!exact.includes(host) && !suffixes.some(s => host === s || host.endsWith('.'+s))) throw fail('Use GitHub, GitLab, Drive, or a supported project host such as Vercel, Netlify, or Cloudflare Pages.');
  return url;
}
async function cohortBoard(programId, viewerId, period = 'all') {
  if (!['all','week'].includes(period)) throw fail('Choose all time or this week.');
  const key = String(programId)+':'+period;
  let entries = cache.get(key);
  if (!entries || entries.expires <= Date.now()) {
    const now = new Date(), day=86400000, local=new Date(+now+19800000);
    const midnight=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-19800000;
    const start=period==='week' ? midnight-((local.getUTCDay()+6)%7)*day : -Infinity;
    const resources=await Resource.find({program:programId,publishedAt:{$ne:null}}).select('_id type').lean();
    const types=new Map(resources.map(r=>[String(r._id),r.type]));
    const mentees=await Mentee.find({programs:programId}).select('name showOnBoard completedResources').lean();
    const rows=mentees.map(m=>{
      const completions=m.completedResources.filter(c=>types.has(String(c.resource)));
      const graded=completions.filter(c=>(types.get(String(c.resource))!=='project'||c.verified) && (period==='all'||+new Date(c.scoredOn||c.completedOn)>=start));
      return {id:String(m._id),name:publicName(m.name),visible:m.showOnBoard!==false,
        score:graded.reduce((sum,c)=>sum+(c.score||0),0),streak:streakFor(completions,now),
        latest:Math.max(0,...graded.map(c=>+new Date(c.submittedOn||c.completedOn)||0))};
    });
    const ranked=rows.filter(r=>r.visible).sort((a,b)=>b.score-a.score || a.latest-b.latest || a.id.localeCompare(b.id));
    let rank=0;ranked.forEach((r,i)=>{if(i===0||r.score!==ranked[i-1].score)rank=i+1;r.rank=rank;});
    entries={expires:Date.now()+5000,rows,ranked,updatedAt:now.toISOString()};cache.set(key,entries);
    if(cache.size>200)cache.delete(cache.keys().next().value);
  }
  const mine=entries.rows.find(r=>r.id===String(viewerId));
  const ranked=entries.ranked.find(r=>r.id===String(viewerId));
  const ahead=ranked&&entries.ranked.filter(r=>r.score>ranked.score).at(-1);
  const safe=r=>({id:r.id,name:r.name,score:r.score,streak:r.streak,rank:r.rank,isYou:r.id===String(viewerId)});
  return {updatedAt:entries.updatedAt,total:entries.ranked.length,period,rows:entries.ranked.slice(0,20).map(safe),
    you:mine?{...safe(mine),rank:ranked?.rank||null,optedOut:!mine.visible,pointsToPass:ahead?ahead.score-mine.score+1:null}:null};
}
module.exports={ resourceView, projectUrl, cohortBoard, invalidateBoards, publicName };

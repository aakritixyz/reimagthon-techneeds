const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const {createHash}=require('node:crypto');
const {demoId:id,assertDemoDatabase,DEMO_MENTOR_ID,DEMO_MENTEE_ID}=require('./demoMode');
const {allocationSnapshot,solve}=require('./allocation');
const {refreshProgress}=require('./progress');
const {invalidateBoards}=require('./menteeLearning');
const names=['Program','Mentor','Mentee','Enrollment','Resource','Quiz','QuizSubmission','MentorInvite','AllocationProposal','AuditLog'];
const models=Object.fromEntries(names.map(name=>[name,require('../models/'+name)]));
const State=mongoose.models.DemoState||mongoose.model('DemoState',new mongoose.Schema({_id:String,seededAt:Date}));
const day=86400000;
async function seedDemo({reset=false}={}){
  assertDemoDatabase();await State.init();
  if(!reset&&await State.exists({_id:'walkthrough-v1'}))return;
  const now=Date.now(),date=days=>new Date(now+days*day),password=await bcrypt.hash('demo123',12);
  const trackNames=['Web Development','Machine Learning','App Development','DSA in C/C++','DSA in Java','AR/VR Mentorship'];
  const mentorNames=['Demo Mentor','Ananya Rao','Meera Sen','Kavya Singh','Tara Mehta','Zoya Khan'];
  const programIds=trackNames.map((_,i)=>id(100+i)),mentorIds=mentorNames.map((_,i)=>id(1001+i));
  const assignments=[[0,1],[0,4],[0,3],[2,5],[1,5],[3,4]];
  const resourceRecords=[],quizRecords=[];let resourceSequence=10000;
  function resource(programIndex,type,title,score,deadline,extra={}){
    const record={_id:id(resourceSequence++),program:programIds[programIndex],type,title,maxScore:score,deadline:date(deadline),publishedAt:date(-8),addedBy:mentorIds[assignments[programIndex][0]],description:extra.description||'',...extra};
    resourceRecords.push(record);return record;
  }
  function quiz(resource,questions,start=-3){
    const q={_id:id(30000+quizRecords.length),resource:resource._id,startTime:date(start),endTime:resource.deadline,revealScores:true,questions:questions.map((q,i)=>({_id:id(31000+quizRecords.length*10+i),...q}))};quizRecords.push(q);resource.quiz=q._id;return q;
  }
  const video=resource(0,'video','HTML & CSS foundations',20,-1,{description:'Revisit semantic HTML, the box model, and responsive layout fundamentals.',url:'https://www.youtube.com/watch?v=G3e-cpL7ofc'});
  const pastQuiz=resource(0,'quiz','JavaScript checkpoints',30,-.25,{description:'A completed checkpoint with a score breakdown and answer review.'});
  const pastQuizDoc=quiz(pastQuiz,[{questionText:'Which keyword declares a block-scoped variable?',options:['var','let','define'],correctOptionIndex:1,marks:10},{questionText:'Which array method transforms every item?',options:['map','find','push'],correctOptionIndex:0,marks:10},{questionText:'Which comparison checks both value and type?',options:['==','=','==='],correctOptionIndex:2,marks:10}]);
  const graded=resource(0,'project','Your first responsive portfolio',100,-.5,{description:'A finished milestone, with detailed mentor feedback.',instructions:'Build a responsive portfolio with an introduction, project gallery, and contact section. Use semantic HTML, accessible focus styles, and a layout that works on mobile. Submit a repository or a live demo.'});
  const pending=resource(0,'project','Build a community event board',100,2,{description:'Your work is with your mentor. You can still update the submission.',instructions:'Create an event board for a campus community. Include event cards, track filters, an upcoming-events view, and a responsive layout. Explain your component structure and accessibility choices in your submission note.'});
  const nextVideo=resource(0,'video','Responsive layouts: the next step',25,.25,{description:'A guided practice session on grids, spacing, and layouts that adapt.',url:'https://www.youtube.com/watch?v=G3e-cpL7ofc'});
  const nextQuiz=resource(0,'quiz','React essentials',40,3,{description:'Check your understanding of components, props, state, and keys.'});
  quiz(nextQuiz,[{questionText:'What is a React component?',options:['A reusable piece of UI','A database table','A CSS file'],correctOptionIndex:0,marks:10},{questionText:'What does useState help manage?',options:['HTTP headers','Component state','Image compression'],correctOptionIndex:1,marks:10},{questionText:'How do parent components pass data to children?',options:['Props','SQL queries','CSS selectors'],correctOptionIndex:0,marks:10},{questionText:'Why do list items need stable keys?',options:['To increase font size','To help React identify items','To encrypt data'],correctOptionIndex:1,marks:10}],-1);
  const newProject=resource(0,'project','Ship your developer portfolio',100,4,{description:'Turn your learning into a polished project you can share.',instructions:'Build and deploy your developer portfolio. Include at least three project cards, a responsive navigation, clear contact links, and keyboard-accessible controls. Add a README explaining how to run the project and one improvement you would make next.'});
  resource(0,'video','Git & GitHub kickoff',15,-2,{description:'An earlier module whose deadline has passed. This demonstrates the missed state.',url:'https://www.youtube.com/watch?v=RGOj5yH7evk'});
  resource(0,'video','Preview: building with Next.js',30,6,{description:'A mentor draft, hidden from mentees until it is published.',url:'https://www.youtube.com/watch?v=G3e-cpL7ofc',publishedAt:null});
  const mlVideo=resource(1,'video','Start your Python learning notebook',20,2,{description:'A first step in the machine-learning track.',url:'https://www.youtube.com/watch?v=G3e-cpL7ofc'});
  resource(1,'project','Explore and explain a dataset',60,5,{description:'Practice asking useful questions of data.',instructions:'Choose a public dataset. Clean the data, create three informative plots, and write a short explanation of the patterns you find. Share a notebook repository or a Drive link with your findings.'});
  resource(2,'video','Designing your first app interface',25,2,{description:'Think in screens, states, and reusable components.',url:'https://www.youtube.com/watch?v=G3e-cpL7ofc'});
  resource(2,'project','Prototype a campus companion',75,6,{description:'A small app idea with a useful everyday purpose.',instructions:'Design a campus companion app with a home screen, events listing, and saved-items view. Build a working prototype with clear navigation. Submit the source code and explain the main user journey.'});
  for(let i=3;i<6;i++)resource(i,'video',`${trackNames[i]} / getting started`,20,3,{description:'A starting module for this demo cohort.',url:'https://www.youtube.com/watch?v=G3e-cpL7ofc'});
  const people=['Demo Mentee','Anika Sharma','Riya Kapoor','Sanya Mehta','Isha Verma','Aditi Rao','Naina Gupta','Diya Singh','Tanya Joshi','Sara Khan','Kriti Bansal','Maya Sethi','Avni Jain'];
  const projectScores=[85,100,95,88,70,65,60,55,50,45,40,35,30];
  const menteeRecords=people.map((name,i)=>{
    const mid=id(2001+i),programs=i===0?[programIds[0],programIds[1]]:i<5?[programIds[0],programIds[2]]:[programIds[0]];
    const completedResources=[{_id:id(40000+i*10),resource:video._id,score:20,completedOn:date(-3),scoredOn:date(-3),verified:true},{_id:id(40001+i*10),resource:pastQuiz._id,score:i===0?20:30,completedOn:date(-2),scoredOn:date(-2),verified:true},{_id:id(40002+i*10),resource:graded._id,score:projectScores[i],completedOn:date(-1),submittedOn:date(-1),scoredOn:date(-.4),verified:true,gradedBy:DEMO_MENTOR_ID,githubLink:'https://github.com/vercel/next.js',deployedLink:'',description:'Demo submission for the walkthrough.',feedback:i===0?'Strong visual hierarchy and a thoughtful mobile layout. Your components are easy to follow. Next, improve keyboard navigation and add descriptive alt text to project images.':'Good progress. Keep refining the layout and explain your decisions in the README.'}];
    if(i<4)completedResources.push({_id:id(40003+i*10),resource:pending._id,score:0,completedOn:date(-.1),submittedOn:date(-.1),submissionDates:Array.from({length:i===0?1:5},(_,n)=>date(-n)),verified:false,githubLink:'https://github.com/vercel/next.js',deployedLink:'',description:i===0?'I built the event cards, topic filters, and a responsive empty state. I would love feedback on keyboard navigation and the spacing between cards.':'Demo project ready for mentor review.'});
    const record={_id:mid,name,email:i===0?'demo.mentee@techneeds.local':`learner${i}@techneeds.local`,enrollmentNumber:`TN26-DEMWEB-${String(i+1).padStart(4,'0')}`,password,programs,completedResources,mustChangePw:false,authVersion:0,showOnBoard:true,createdBy:DEMO_MENTOR_ID,lastLoginAt:date(-.1)};refreshProgress(record);return record;
  });
  await mongoose.connection.transaction(async session=>{
    for(const model of Object.values(models))await model.deleteMany({}).session(session);
    const programs=trackNames.map((name,i)=>({_id:programIds[i],name,cohort:i===4?'Winter 2026':'Fall 2026',description:['Build accessible websites, learn React, and ship a portfolio with your peers.','Explore Python, data, and the first steps of machine learning.','Turn an app idea into a working prototype.','Practice problem solving and core data structures.','Learn algorithmic thinking with Java.','Explore immersive interfaces and interactive experiences.'][i],startDate:date(-14),endDate:date(42),maxMentees:[32,20,24,24,20,18][i],minMentors:2,maxMentors:4,status:['ACTIVE','ACTIVE','OPEN','ACTIVE','DRAFT','OPEN'][i],code:['DEMWEB','DEMML','DEMAPP','DEMCPP','DEMJAVA','DEMXR'][i],enrollmentSeq:i===0?13:5,mentors:assignments[i].map(n=>mentorIds[n]),resources:resourceRecords.filter(r=>String(r.program)===String(programIds[i])).map(r=>r._id),createdAt:date(-14-i),updatedAt:date(-1)}));
    await models.Program.create(programs,{session,ordered:true});
    const mentors=mentorNames.map((name,i)=>({_id:mentorIds[i],name,email:i===0?'demo.mentor@techneeds.local':`mentor${i}@techneeds.local`,password,approved:true,maxTracks:i===0?3:2,seatsPerTrack:i===0?16:12,programs:assignments.flatMap((arr,p)=>arr.includes(i)?[programIds[p]]:[]),trackScores:Object.fromEntries(assignments.flatMap((arr,p)=>arr.includes(i)?[[String(programIds[p]),95-p*3-i]]:[]))}));
    await models.Mentor.create(mentors,{session,ordered:true});await models.Resource.create(resourceRecords,{session,ordered:true});await models.Quiz.create(quizRecords,{session,ordered:true});await models.Mentee.create(menteeRecords,{session,ordered:true});
    const enrollments=menteeRecords.flatMap((m,i)=>m.programs.map((pid,index)=>({mentee:m._id,program:pid,enrollmentNumber:index===0?m.enrollmentNumber:`TN26-${String(pid)===String(programIds[1])?'DEMML':'DEMAPP'}-${String(i+1).padStart(4,'0')}`})));
    await models.Enrollment.create(enrollments,{session,ordered:true});
    await models.QuizSubmission.create(menteeRecords.map((m,i)=>({quiz:pastQuizDoc._id,resource:pastQuiz._id,mentee:m._id,score:i===0?20:30,submittedAt:date(-2),answers:pastQuizDoc.questions.map((q,j)=>({questionId:q._id,selectedOptionIndex:i===0&&j===2?0:q.correctOptionIndex}))})),{session,ordered:true});
    await models.MentorInvite.create([{name:'Leena Kapoor',email:'leena.demo@techneeds.local',programIds:[programIds[0]],tokenHash:createHash('sha256').update('demo-invite-pending-v1').digest('hex'),expiresAt:date(2)},{name:'Nisha Rao',email:'nisha.demo@techneeds.local',programIds:[programIds[1]],tokenHash:createHash('sha256').update('demo-invite-expired-v1').digest('hex'),expiresAt:date(-1)},{name:'Aarna Shah',email:'aarna.demo@techneeds.local',programIds:[programIds[2]],tokenHash:createHash('sha256').update('demo-invite-revoked-v1').digest('hex'),expiresAt:date(1),revokedAt:date(-.1)}],{session,ordered:true});
    await models.AuditLog.create([{actor:'ADMIN',action:'PROGRAM_CREATED',target:String(programIds[0]),meta:{name:'Web Development',cohort:'Fall 2026'},createdAt:date(-3)},{actor:'ADMIN',action:'MENTOR_INVITED',target:'demo-mentor',meta:{email:'demo.mentor@techneeds.local'},createdAt:date(-2)},{actor:`MENTOR:${DEMO_MENTOR_ID}`,action:'MENTEES_ENROLLED',target:String(programIds[0]),meta:{count:13},createdAt:date(-2)},{actor:`MENTOR:${DEMO_MENTOR_ID}`,action:'RESOURCE_PUBLISHED',target:String(nextVideo._id),meta:{name:nextVideo.title},createdAt:date(-1)},{actor:`MENTOR:${DEMO_MENTOR_ID}`,action:'PROJECT_GRADED',target:String(graded._id),meta:{menteeId:String(DEMO_MENTEE_ID),previousScore:null,score:85},createdAt:date(-.4)},{actor:`MENTEE:${DEMO_MENTEE_ID}`,action:'PROJECT_SUBMITTED',target:String(pending._id),meta:{programId:String(programIds[0])},createdAt:date(-.1)}],{session,ordered:true});
    await State.updateOne({_id:'walkthrough-v1'},{$set:{seededAt:new Date()}},{upsert:true,session});
  });
  invalidateBoards();
  const snapshot=await allocationSnapshot();const input={...snapshot.input,locked:[],banned:[],time_limit:10};
  const plan=await solve(input);await models.AllocationProposal.create({fingerprint:snapshot.fingerprint,input,plan});
  console.log('Demo ready: 6 programs, 6 mentors, 13 mentees, resources, submissions, and an allocation draft.');
}
module.exports={seedDemo};

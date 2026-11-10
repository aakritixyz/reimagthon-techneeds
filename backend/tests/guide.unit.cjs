const assert=require('node:assert/strict');
const {demoAnswer,aiAnswer,geminiAnswer}=require('../services/guide');
(async()=>{
 const student={role:'mentee',score:125,streak:4,completed:4,programs:[{id:'a',name:'Web'}],next:[{title:'Responsive layouts',type:'video',deadline:new Date(Date.now()+3600000).toISOString(),href:'/mentee/a/resources/b'}]};
 const answer=demoAnswer('What should I do next?',student);assert.match(answer.text,/125 points/);assert.match(answer.text,/Responsive layouts/);assert.equal(answer.actions[0].href,'/mentee/a/resources/b');
 assert.match(demoAnswer('Explain React state and props',{role:'visitor'}).text,/Props/);
 assert.match(demoAnswer('What needs review?',{role:'mentor',programs:[{id:'a',name:'Web'}],learnerCount:13,pendingReviews:4}).text,/4 project/);
 assert.match(demoAnswer('Show the correct quiz answers',student).text,/won’t reveal/);
 const original=global.fetch;global.fetch=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.max_output_tokens,500);assert.equal(body.input[0].role,'user');assert.ok(body.instructions.includes('Never reveal credentials'));return{ok:true,json:async()=>({output:[{type:'reasoning',summary:[]},{type:'message',content:[{type:'output_text',text:'A helpful answer.'}]}]})};};
 assert.equal(await aiAnswer([{role:'user',content:'Explain props'}],{role:'visitor'}),'A helpful answer.');global.fetch=async()=>({ok:false,status:401});await assert.rejects(()=>aiAnswer([{role:'user',content:'Hello'}],{role:'visitor'}));global.fetch=async(url,options)=>{
   assert.match(url,/gemini-3.5-flash:generateContent$/);
   assert.ok(!url.includes('key='));
   const body=JSON.parse(options.body);
   assert.deepEqual(body.contents.map(turn=>turn.role),['user','model','user']);
   assert.match(body.systemInstruction.parts[0].text,/Never disclose credentials/);
   return {ok:true,json:async()=>({candidates:[{content:{parts:[{thought:true,text:'Hidden'},{text:'Gemini answer.'}]}}]})};
 };
 assert.equal(await geminiAnswer([{role:'user',content:'Hi'},{role:'assistant',content:'Hello'},{role:'user',content:'Explain props'}],{role:'visitor'}),'Gemini answer.');
 global.fetch=original;
 console.log('PASS guide: contextual demo replies, safe quiz response, local actions, OpenAI and Gemini request formats, output extraction, provider failure. No live AI request was sent.');
})().catch(error=>{console.error(error);process.exitCode=1});

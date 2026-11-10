const express=require('express');
const {sameOrigin}=require('../middleware/authAdmin');
const {contextFor,demoAnswer,aiAnswer,aiProvider}=require('../services/guide');
const router=express.Router(),limits=new Map();
router.get('/',(_req,res)=>res.set('Cache-Control','no-store').json({mode:aiProvider()?'ai':'demo',provider:aiProvider()}));
router.post('/',sameOrigin,async(req,res)=>{
  const now=Date.now(),key=req.ip;for(const[ip,value]of limits)if(value.until<=now)limits.delete(ip);
  const limit=limits.get(key)||{count:0,until:now+10*60000};limit.count++;limits.set(key,limit);
  if(limit.count>40)return res.status(429).json({error:'The guide is taking a short break. Please try again in a few minutes.'});
  const messages=req.body.messages;
  if(!Array.isArray(messages)||!messages.length||messages.length>10||messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>2000)||messages.at(-1).role!=='user'||messages.reduce((s,m)=>s+m.content.length,0)>12000)return res.status(400).json({error:'Send a question of up to 2,000 characters.'});
  try{
    const context=await contextFor(req),fallback=demoAnswer(messages.at(-1).content,context);
    let text=fallback.text,mode='demo';
    if(aiProvider()){try{text=await aiAnswer(messages,context);mode='ai';}catch{mode='fallback';}}
    res.set('Cache-Control','private, no-store').json({text,mode,provider:mode==='ai'?aiProvider():null,actions:fallback.actions,role:context.role});
  }catch{res.status(503).json({error:'The guide cannot load your workspace right now. Try again in a moment.'});}
});
module.exports=router;

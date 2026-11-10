const express=require('express');
const {demoEnabled}=require('../services/demoMode');
const {sameOrigin}=require('../middleware/authAdmin');
const {seedDemo}=require('../services/seedDemo');
const router=express.Router();
router.get('/status',(_req,res)=>res.json({enabled:demoEnabled()}));
router.post('/reset',sameOrigin,async(req,res)=>{
  if(!demoEnabled())return res.status(404).json({error:'Not found.'});
  if(req.body.confirm!==true)return res.status(400).json({error:'Confirm that the demo walkthrough should be reset.'});
  try{
    await seedDemo({reset:true});
    res.clearCookie('tn_admin',{path:'/api/admin'});res.clearCookie('tn_mentor',{path:'/api'});res.clearCookie('tn_mentee',{path:'/'});
    res.json({ok:true});
  }catch(error){console.error('Demo reset failed:',error.name);res.status(500).json({error:'Unable to reset the demo. Please try again.'});}
});
module.exports=router;

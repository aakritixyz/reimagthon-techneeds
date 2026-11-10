'use client';
import {useState} from 'react';
import {resetDemo} from '@/lib/api';
import {IS_DEMO} from '@/lib/demo';
import styles from './demo.module.css';
export default function DemoReset(){
  const[armed,setArmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  if(!IS_DEMO)return null;
  return <div className={styles.reset}><div><strong>Ready for another take?</strong><p>Reset only the fictional demo data to restore quizzes, submissions, and the starting scores.</p>{error&&<p role="alert">{error}</p>}</div><div>{armed?<><button disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await resetDemo();window.location.assign('/techboard');}catch(err){setError(err.message);setBusy(false);}}}>{busy?'Restoring demo…':'Confirm reset'}</button><button disabled={busy} onClick={()=>setArmed(false)}>Cancel</button></>:<button onClick={()=>setArmed(true)}>Reset walkthrough ↻</button>}</div></div>;
}

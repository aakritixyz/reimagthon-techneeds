'use client';
import {useEffect,useState} from 'react';
import {istDate} from '../mentor/helpers';
import {safeUrl} from './learning';
import ms from './learning.module.css';
export function useClock(){const[now,setNow]=useState(0);useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);return now;}
export function Due({deadline,now}){const remaining=now?+new Date(deadline)-now:null;const urgent=remaining!==null&&remaining>0&&remaining<86400000;return <div className={ms.due} data-urgent={urgent||undefined}><time dateTime={deadline}>Due {istDate(deadline)}</time><small>{remaining===null?'':remaining<=0?'Deadline passed':remaining<3600000?`${Math.max(1,Math.ceil(remaining/60000))}m remaining`:remaining<86400000?`${Math.ceil(remaining/3600000)}h remaining`:`${Math.ceil(remaining/86400000)} days remaining`}</small></div>;}
export function SafeLink({href,children}){const url=safeUrl(href);return url?<a href={url} target="_blank" rel="noopener noreferrer">{children} ↗</a>:null;}

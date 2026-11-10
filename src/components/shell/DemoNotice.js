import Link from 'next/link';
import {IS_DEMO} from '@/lib/demo';
import styles from './demo.module.css';
export default function DemoNotice({role}){
  if(!IS_DEMO)return null;
  return <div className={styles.notice}><span>DEMO WORKSPACE <small>Fictional data · roles open independently</small></span><nav aria-label="Switch demo role">{[['admin','/admin'],['mentor','/mentor'],['mentee','/mentee']].map(([name,href])=><Link key={name} href={href} aria-current={role===name?'page':undefined}>Demo {name} ↗</Link>)}</nav></div>;
}

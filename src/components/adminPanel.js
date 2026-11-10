"use client";

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/api';
import Programs from './admin/Programs';
import Mentors from './admin/Mentors';
import Allocations from './admin/Allocations';
import styles from './admin.module.css';
import { Activity } from './admin/shared';
import WorkspaceBrand from './shell/WorkspaceBrand';
import DemoNotice from './shell/DemoNotice';
import {IS_DEMO,DEMO_ACCOUNTS,DEMO_PASSWORD} from '@/lib/demo';

const views = [ ['overview', '01', 'Overview'], ['programs', '02', 'Programs'], ['mentors', '03', 'Mentors & invites'], ['allocations', '04', 'Allocation studio'], ['activity', '05', 'Activity log'] ];

export default function AdminPanel({ initialView = 'overview' }) {
  const [view, setView] = useState(initialView);
  const [key, setKey] = useState('');
  const [email,setEmail]=useState(IS_DEMO?DEMO_ACCOUNTS.admin.email:'');
  const [demoPassword,setDemoPassword]=useState(IS_DEMO?DEMO_PASSWORD:'');
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() { const result = await adminRequest('/workspace'); setData(result); return result; }
  useEffect(() => {
    let mounted = true;
    adminRequest('/workspace').then(result => { if (mounted) setData(result); }).catch(err => { if (mounted && err.status !== 401) setError(err.message); }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  async function run(action, message = '') {
    setBusy(true); setError(''); setNotice('');
    try { const result = await action(); await load(); setNotice(message); return result || { ok: true }; }
    catch (err) { setError(err.message); if (err.status === 401) setData(null); return null; }
    finally { setBusy(false); }
  }
  async function login(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await adminRequest('/session', { method: 'POST', data: IS_DEMO ? {email,password:demoPassword} : {key} }); setKey(''); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const programs = data?.programs.filter(p => !p.archived) || [];
  const approved = data?.mentors.filter(m => m.approved) || [];
  const pending = data?.invites.filter(i => i.status === 'PENDING') || [];
  return <main id="main-content" data-workspace="admin" className={styles.workspace}>
    {!data ? <div className={styles.loginWrap}><section className={styles.loginStory}><span className={styles.eyebrow}>TECHNEEDS / ADMIN</span><h1>A little structure.<br />A lot of possibility.</h1><p>Build cohorts, bring mentors on board, and make room for the next generation of builders.</p><div className={styles.orbit} aria-hidden="true"><span>TN</span><i /><i /><i /></div><span className={styles.eyebrow}>THE PEOPLE BEHIND THE PROGRESS</span></section><form onSubmit={login} className={styles.loginCard}><span className={styles.eyebrow}>RESTRICTED WORKSPACE</span><h2>{IS_DEMO?'Demo Admin':'Welcome back.'}</h2><p>{IS_DEMO?'Use any email and password to explore the preloaded admin workspace.':'Sign in to manage TechNeeds mentorship.'}</p>{error && <div className={styles.error} role="alert">{error}</div>}{IS_DEMO?<><label>Email<input type="email" value={email} autoComplete="username" onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={demoPassword} autoComplete="current-password" onChange={e=>setDemoPassword(e.target.value)} required/></label></>:<label>Admin key<input type="password" value={key} autoComplete="current-password" onChange={e => setKey(e.target.value)} required /></label>}<button className="tn-button" disabled={busy || !ready}>{!ready ? 'Checking session…' : busy ? 'Opening workspace…' : IS_DEMO?'Sign in as Demo Admin →':'Open admin workspace →'}</button><small>{IS_DEMO?'Demo programs, mentors, invitations, and an allocation draft are ready to explore.':'Your key is exchanged for a private, eight-hour admin session.'}</small></form></div> : <div className={styles.dashboard}>
      <aside data-workspace-sidebar className={styles.sidebar}><div className={styles.sidebarBrand}><WorkspaceBrand role="Admin" dark /></div><nav aria-label="Admin workspace">{views.map(([id, number, title]) => <button type="button" key={id} aria-current={view === id ? 'page' : undefined} onClick={() => { setView(id); setNotice(''); setError(''); }}><span>{number}</span>{title}{id === 'mentors' && pending.length > 0 && <b>{pending.length}</b>}</button>)}</nav><div className={styles.sidebarBottom}><span className={styles.eyebrow}>MAKE GREAT THINGS POSSIBLE.</span><p>Good mentorship starts with a thoughtful plan.</p><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await adminRequest('/session', { method: 'DELETE' }); setData(null); setNotice(''); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>Sign out ↗</button></div></aside>
      <div className={styles.content}><div className={styles.topline}><span>WORKSPACE / {views.find(v => v[0] === view)?.[2].toUpperCase()}</span><button type="button" disabled={busy} onClick={() => run(async () => ({}), 'Workspace refreshed.')}>{busy ? 'Working…' : '↻ Refresh'}</button><span className={styles.adminIdentity}><i /> {IS_DEMO?'Demo Admin':'Administrator'}</span></div>
        <DemoNotice role="admin"/>
        {error && <div className={styles.error} role="alert">{error}</div>}{notice && <div className={styles.notice} role="status">✓ {notice}</div>}
        {view === 'overview' && <><header className={styles.pageHeading}><span className={styles.eyebrow}>LET’S BUILD WHAT’S NEXT</span><h1>Your community,<br /><em>moving forward.</em></h1><p>Everything you need to turn mentorship into momentum.</p></header><div className={styles.stats}>{[['Programs', programs.length, 'Cohorts with room to grow'], ['Approved mentors', approved.length, 'Ready for allocation'], ['Pending invitations', pending.length, 'Waiting to join the journey'], ['Draft plans', data.proposals.filter(p => p.state === 'DRAFT').length, 'Review before you apply']].map(([label, value, caption], i) => <article key={label}><span className={styles.eyebrow}>0{i + 1} / {label}</span><strong>{String(value).padStart(2, '0')}</strong><p>{caption}</p></article>)}</div><div className={styles.overviewGrid}><section className={styles.studioCallout}><span className={styles.eyebrow}>THOUGHTFUL MATCHES. STRONGER COHORTS.</span><h2>A better fit,<br />for every track.</h2><p>Balance mentor capacity, preferences, and cohort needs. Review a suggested plan before making it live.</p><button className="tn-button tn-button-light" onClick={() => setView('allocations')}>Open allocation studio ↗</button><div className={styles.miniNetwork} aria-hidden="true"><span>MENTORS</span><i /><span>TRACKS</span></div></section><section className={styles.card}><div className={styles.sectionTitle}><h2>Set your cohort up for success</h2><span className={styles.eyebrow}>START HERE</span></div>{[['programs', '01', 'Create a program', 'Set the dates, capacity, and mentor needs.'], ['mentors', '02', 'Bring your mentors in', 'Share an invitation and approve applications.'], ['allocations', '03', 'Review your matches', 'Generate a draft, resolve gaps, and apply.']].map(([tab, n, title, copy]) => <button className={styles.step} key={tab} onClick={() => setView(tab)}><span>{n}</span><div><strong>{title}</strong><p>{copy}</p></div><b>↗</b></button>)}</section></div><section className={styles.card}><div className={styles.sectionTitle}><h2>Recent activity</h2><button className={styles.textButton} onClick={() => setView('activity')}>View all →</button></div><Activity entries={data.audit} compact /></section></>}
        {view === 'programs' && <Programs data={data} run={run} busy={busy} />}
        {view === 'mentors' && <Mentors data={data} run={run} busy={busy} />}
        {view === 'allocations' && <Allocations data={data} run={run} busy={busy} />}
        {view === 'activity' && <><header className={styles.pageHeading}><span className={styles.eyebrow}>A RECORD OF THE DETAILS</span><h1>Workspace activity.</h1><p>Program changes, mentor onboarding, and allocation decisions. Showing the latest 50 events.</p></header><section className={styles.card}><Activity entries={data.audit} /></section></>}
        <footer className={styles.workspaceFooter}><span>TECHNEEDS IGDTUW</span><span>Built around people. Backed by a plan.</span></footer>
      </div></div>}
  </main>;
}

"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { acceptMentorInvite } from '@/lib/api';
import styles from '@/components/admin.module.css';
export default function MentorOnboarding() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setToken(new URLSearchParams(window.location.hash.slice(1)).get('token') || ''); }, []);
  return <main id="main-content" className={styles.workspace}><div className={styles.onboard}><span className={styles.eyebrow}>TECHNEEDS / MENTOR ONBOARDING</span><h1>{done ? 'You’re part of the team.' : 'Your next chapter starts here.'}</h1><p>{done ? 'Your account is ready. Sign in to access your assigned programs.' : 'Set a password to accept your private mentor invitation.'}</p>{done ? <Link className="tn-button" href="/mentor">Continue to mentor sign-in →</Link> : <form className={styles.card} onSubmit={async event => { event.preventDefault(); setError(''); if (password !== confirmation) { setError('Your passwords do not match.'); return; } setBusy(true); try { await acceptMentorInvite(token, password); setDone(true); setPassword(''); setConfirmation(''); setToken(''); window.history.replaceState(null, '', '/onboard'); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>{error && <div className={styles.error} role="alert">{error}</div>}<label>Create a password<input type="password" autoComplete="new-password" value={password} required minLength={10} maxLength={72} onChange={e => setPassword(e.target.value)} /></label><label>Confirm password<input type="password" autoComplete="new-password" value={confirmation} required minLength={10} maxLength={72} onChange={e => setConfirmation(e.target.value)} /></label><p className={styles.help}>Use at least 10 characters. Invitations expire after 48 hours and work once.</p><button className="tn-button" disabled={busy || !token}>{busy ? 'Creating your account…' : 'Accept invitation →'}</button>{!token && <p className={styles.muted}>Open the full private invitation link shared by your admin.</p>}</form>}</div></main>;
}

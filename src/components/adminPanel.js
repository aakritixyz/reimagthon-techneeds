"use client";

import { useState } from 'react';
import { createProgram, createMentor, addMentorToProgram, getAllPrograms, getAllMentors } from '../lib/api';
import styles from './admin.module.css';

const emptyMentor = { name: '', email: '' };

export default function AdminPanel() {
  const [key, setKey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [programName, setProgramName] = useState('');
  const [mentor, setMentor] = useState(emptyMentor);
  const [programs, setPrograms] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [credentials, setCredentials] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [programList, mentorList] = await Promise.all([getAllPrograms(key), getAllMentors(key)]);
    setPrograms(programList);
    setMentors(mentorList);
  }

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  function lock() {
    setUnlocked(false);
    setKey('');
    setCredentials(null);
    setError('');
  }

  return (
    <main id="main-content" className={styles.workspace}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <div>
            <p>TECHNEEDS WORKSPACE</p>
            <h1>Admin panel</h1>
            <span>Create cohorts and give mentors access.</span>
          </div>
          {unlocked && <button className="tn-button tn-button-quiet" onClick={lock} disabled={busy}>Lock panel</button>}
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}

        {!unlocked ? (
          <form className={styles.card} onSubmit={(event) => {
            event.preventDefault();
            run(async () => {
              await load();
              setUnlocked(true);
            });
          }}>
            <h2>Open admin panel</h2>
            <label>Local admin key<input type="password" value={key} onChange={(event) => setKey(event.target.value)} required /></label>
            <button className="tn-button" disabled={busy}>Open workspace</button>
          </form>
        ) : (
          <>
            <div className={styles.forms}>
              <form className={styles.card} onSubmit={(event) => {
                event.preventDefault();
                run(async () => {
                  const program = await createProgram(programName.trim(), key);
                  setPrograms((list) => [...list, program]);
                  setProgramName('');
                });
              }}>
                <h2>Create a cohort</h2>
                <label>Cohort name<input value={programName} onChange={(event) => setProgramName(event.target.value)} required /></label>
                <button className="tn-button" disabled={busy || !programName.trim()}>Create cohort</button>
              </form>

              <form className={styles.card} onSubmit={(event) => {
                event.preventDefault();
                run(async () => {
                  const result = await createMentor(mentor, key);
                  setCredentials({ email: result.mentor.email, password: result.tempPassword });
                  setMentors((list) => [...list, { ...result.mentor, programs: [] }]);
                  setMentor(emptyMentor);
                });
              }}>
                <h2>Create a mentor account</h2>
                <label>Full name<input value={mentor.name} onChange={(event) => setMentor({ ...mentor, name: event.target.value })} required /></label>
                <label>Email<input type="email" value={mentor.email} onChange={(event) => setMentor({ ...mentor, email: event.target.value })} required /></label>
                <button className="tn-button" disabled={busy}>Generate credentials</button>
                {credentials && (
                  <div className={styles.credentials} role="status">
                    <strong>Share these credentials with the mentor.</strong>
                    <span>{credentials.email}</span>
                    <code>{credentials.password}</code>
                    <button type="button" className="tn-button tn-button-quiet" onClick={() => setCredentials(null)}>Hide credentials</button>
                  </div>
                )}
              </form>
            </div>

            <section className={styles.card} aria-labelledby="cohorts-heading">
              <h2 id="cohorts-heading">Cohorts</h2>
              {!programs.length && <p>Start by creating your first cohort.</p>}
              {programs.map((program) => {
                const assigned = mentors.filter((entry) => program.mentors.includes(entry._id));
                const available = mentors.filter((entry) => !program.mentors.includes(entry._id));
                return (
                  <div className={styles.cohort} key={program._id}>
                    <h3>{program.name}</h3>
                    <p>{assigned.length ? assigned.map(({ name }) => name).join(', ') : 'No mentors assigned yet.'}</p>
                    {available.length > 0 && (
                      <form className={styles.assign} onSubmit={(event) => {
                        event.preventDefault();
                        const mentorId = new FormData(event.currentTarget).get('mentor');
                        run(async () => {
                          await addMentorToProgram(program._id, mentorId, key);
                          await load();
                        });
                      }}>
                        <label>Assign a mentor to {program.name}
                          <select name="mentor" required defaultValue="">
                            <option value="" disabled>Select mentor</option>
                            {available.map((entry) => <option key={entry._id} value={entry._id}>{entry.name} ({entry.email})</option>)}
                          </select>
                        </label>
                        <button className="tn-button" disabled={busy}>Assign mentor</button>
                      </form>
                    )}
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

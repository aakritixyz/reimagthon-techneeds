"use client";
import { useEffect, useState } from 'react';
import { downloadCredentials, istDate } from './helpers';
import styles from '../admin.module.css';
import ms from './workspace.module.css';
export function Credentials({ rows, hide }) {
  return <section className={styles.linkPanel} role="status"><div className={styles.sectionTitle}><h2>Credentials ready</h2><button className={styles.textButton} onClick={hide}>Hide & clear ×</button></div><p>Download or copy these now. Initial passwords are shown once and are never saved in this browser. Mentees must change them at first sign-in. Share them privately.</p><div className={ms.tableScroll}><table className={ms.table}><thead><tr><th>Name</th><th>Enrollment number</th><th>Initial password</th></tr></thead><tbody>{rows.map(r => <tr key={r.enrollmentNumber}><td><strong>{r.name}</strong><small>{r.email}</small></td><td><code>{r.enrollmentNumber}</code></td><td>{r.password ? <code>{r.password}</code> : <span>Existing account · password unchanged</span>}</td></tr>)}</tbody></table></div><button className="tn-button" onClick={() => downloadCredentials(rows)}>Download credentials CSV ↓</button></section>;
}
export function Pagination({ page, pages, total, onChange, busy }) {
  return <div className={ms.pagination}><span>{total} total · Page {page} of {Math.max(1,pages)}</span><div><button className={styles.textButton} disabled={busy || page <= 1} onClick={() => onChange(page-1)}>← Previous</button><button className={styles.textButton} disabled={busy || page >= pages} onClick={() => onChange(page+1)}>Next →</button></div></div>;
}
export function Deadline({ value }) {
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()),60000); return () => clearInterval(timer); }, []);
  const remaining = +new Date(value)-now;
  const label = !now ? '' : remaining <= 0 ? 'Deadline passed' : remaining < 3600000 ? `${Math.ceil(remaining/60000)}m remaining` : remaining < 86400000 ? `${Math.ceil(remaining/3600000)}h remaining` : `${Math.ceil(remaining/86400000)} days remaining`;
  return <div className={ms.deadline}><time dateTime={value}>Due {istDate(value)}</time><small data-overdue={now && remaining <= 0 ? 'true' : undefined}>{label}</small></div>;
}

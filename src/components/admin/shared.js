import styles from '../admin.module.css';
export const displayDate = value => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Dates to be set';
export function Status({ children }) { return <span className={styles.status} data-status={children}>{children}</span>; }
export function Empty({ title, children }) { return <div className={styles.empty}><span aria-hidden="true">＋</span><h3>{title}</h3><p>{children}</p></div>; }
export function Activity({ entries, compact = false }) {
  if (!entries.length) return <p className={styles.muted}>Your workspace activity will appear here.</p>;
  return <ol className={styles.activity}>{entries.slice(0, compact ? 5 : 50).map(item => <li key={item._id}><span className={styles.activityDot} /><div><strong>{item.action.toLowerCase().replaceAll('_', ' ')}</strong><p>{item.meta?.name || item.meta?.email || (item.meta?.score !== undefined ? `${item.meta.previousScore ?? 'Ungraded'} → ${item.meta.score} pts` : item.meta?.count ? `${item.meta.count} mentees enrolled` : String(item.actor || '').startsWith('MENTOR') ? 'Mentor workspace' : String(item.actor || '').startsWith('MENTEE') ? 'Mentee account' : 'Admin workspace')}</p></div><time dateTime={item.createdAt}>{displayDate(item.createdAt)}<small>{new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small></time></li>)}</ol>;
}

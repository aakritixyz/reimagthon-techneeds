import Papa from 'papaparse';
export function parseMenteeCsv(text) {
  const parsed = Papa.parse(text.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim().toLowerCase() });
  const errors = parsed.errors.map(e => `Row ${(e.row ?? 0)+2}: ${e.message}`);
  if (!parsed.meta.fields?.includes('name') || !parsed.meta.fields?.includes('email')) errors.push('CSV headers must include name,email.');
  if (!parsed.data.length || parsed.data.length > 200) errors.push('Upload between 1 and 200 mentees.');
  const seen = new Set();
  const rows = parsed.data.map((r,i) => {
    const name = (r.name || '').trim(), email = (r.email || '').trim().toLowerCase();
    if (name.length < 2 || name.length > 80) errors.push(`Row ${i+2}: name must be 2–80 characters.`);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.push(`Row ${i+2}: enter a valid email.`);
    if (seen.has(email)) errors.push(`Row ${i+2}: duplicate email ${email}.`);
    seen.add(email); return { name, email };
  });
  return { rows, errors };
}
export function downloadCredentials(rows) {
  const csv = Papa.unparse(rows.map(r => ({ name: r.name, email: r.email, enrollmentNumber: r.enrollmentNumber, initialPassword: r.password || 'Use existing password' })), { escapeFormulae: true });
  const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'techneeds-credentials.csv'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const inputDate = value => value ? new Date(+new Date(value)+19800000).toISOString().slice(0,16) : '';
export const utcDate = value => value ? new Date(value+'+05:30').toISOString() : '';
export const istDate = value => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })+' IST' : 'No date set';

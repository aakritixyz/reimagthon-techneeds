const mongoose = require('mongoose');
const demoId = value => new mongoose.Types.ObjectId(Number(value).toString(16).padStart(24,'d'));
const DEMO_MENTOR_ID = demoId(1001);
const DEMO_MENTEE_ID = demoId(2001);
function demoEnabled() {
  return process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production' && ['127.0.0.1','localhost','::1'].includes(process.env.HOST || '127.0.0.1');
}
function demoDatabaseName() {
  const name = process.env.DEMO_DB_NAME || 'techneeds_demo';
  if (!/^techneeds_demo(?:_test)?$/.test(name)) throw new Error('Demo mode must use the reserved techneeds_demo or techneeds_demo_test database.');
  return name;
}
function assertDemoDatabase() {
  if (!demoEnabled() || mongoose.connection.name !== demoDatabaseName()) throw new Error('Demo fixture operation refused outside the demo database.');
}
module.exports = { demoEnabled, demoDatabaseName, assertDemoDatabase, demoId, DEMO_MENTOR_ID, DEMO_MENTEE_ID };

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { once } = require('node:events');
const connectDB = require('./config/db');

const app = express();
const port = process.env.PORT || 8000;
const host = process.env.HOST || '127.0.0.1';

app.use(cors({
  credentials: true,
  origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000', 'http://127.0.0.1:3000'],
}));
app.use(express.json());
app.use('/api/demo', require('./routes/demoRoutes'));
const guide = require('./routes/guideRoutes');
for (const route of ['/api/guide','/api/admin/guide','/api/mentor/guide','/api/m/guide']) app.use(route,guide);
const admin = require('./routes/adminRoutes');
app.use('/api/admin', admin.router);
app.use('/api/onboard', admin.onboarding);
app.use('/api/mentors/login', require('./middleware/rateLimit')());
app.use('/api/m/login', require('./middleware/rateLimit')({ limit: 300 }));
const mentorWorkspace = require('./routes/mentorWorkspaceRoutes');
app.use('/api/mentor', mentorWorkspace.router);
app.use('/api', mentorWorkspace.legacy);
app.use('/api', require('./routes/mentorRoutes'));
app.use('/api/m', require('./routes/menteeRoutes'));
app.get('/', (_req, res) => res.send('Mentorship API Running'));

async function start() {
  for (const name of ['MONGO_URI', 'JWT_SECRET', 'ADMIN_KEY']) {
    if (!process.env[name]) throw new Error(`Set ${name} in backend/.env before starting.`);
  }
  await connectDB();
  await Promise.all(['Program', 'Mentor', 'MentorInvite', 'AllocationProposal', 'AuditLog', 'Mentee', 'Enrollment', 'Resource', 'Quiz', 'QuizSubmission'].map(name => require(`./models/${name}`).init()));
  // Existing resources were public before draft support; preserve that visibility.
  await require('./models/Resource').updateMany({ publishedAt: { $exists: false } }, [{ $set: { publishedAt: { $ifNull: ['$createdAt', new Date()] } } }]);
  if (require('./services/demoMode').demoEnabled()) await require('./services/seedDemo').seedDemo();
  await once(app.listen(port, host), 'listening');
  console.log(`TechNeeds API listening on http://${host}:${port}`);
}

start().catch(async (error) => {
  const message = error.code === 'EADDRINUSE' ? `Port ${port} is already in use.` : error.message;
  console.error(message);
  await mongoose.disconnect();
  process.exitCode = 1;
});

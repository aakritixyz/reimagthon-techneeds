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
  origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000', 'http://127.0.0.1:3000'],
}));
app.use(express.json());
app.use('/api', require('./routes/mentorRoutes'));
app.use('/api/m', require('./routes/menteeRoutes'));
app.get('/', (_req, res) => res.send('Mentorship API Running'));

async function start() {
  for (const name of ['MONGO_URI', 'JWT_SECRET', 'ADMIN_KEY']) {
    if (!process.env[name]) throw new Error(`Set ${name} in backend/.env before starting.`);
  }
  await connectDB();
  await once(app.listen(port, host), 'listening');
  console.log(`TechNeeds API listening on http://${host}:${port}`);
}

start().catch(async (error) => {
  const message = error.code === 'EADDRINUSE' ? `Port ${port} is already in use.` : error.message;
  console.error(message);
  await mongoose.disconnect();
  process.exitCode = 1;
});

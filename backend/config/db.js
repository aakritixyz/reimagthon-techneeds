const mongoose = require('mongoose');
const {demoEnabled,demoDatabaseName}=require('../services/demoMode');

module.exports = async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, ...(demoEnabled()?{dbName:demoDatabaseName()}:{}) });
  console.log('MongoDB connected');
};

const mongoose = require('mongoose');

module.exports = async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected');
};

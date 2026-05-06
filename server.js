require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
mongoose.set('bufferCommands', false);
let isDbConnected = false;
let dbConnectPromise = null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI;
const connectToDatabase = async () => {
  if (!MONGO_URI || MONGO_URI === 'PASTE_YOUR_ATLAS_URI_HERE') {
    throw new Error('MONGO_URI is not configured. Add it in environment variables.');
  }
  if (isDbConnected && mongoose.connection.readyState === 1) return;
  if (dbConnectPromise) return dbConnectPromise;

  dbConnectPromise = mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  })
    .then(() => {
      isDbConnected = true;
      console.log('✅ MongoDB Atlas connected');
    })
    .catch((err) => {
      isDbConnected = false;
      throw err;
    })
    .finally(() => {
      dbConnectPromise = null;
    });

  return dbConnectPromise;
};

app.use('/api', (req, res, next) => {
  connectToDatabase()
    .then(() => next())
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable right now. Check MongoDB connectivity and try again.',
      });
    });
});

const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

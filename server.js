require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
mongoose.set('bufferCommands', false);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI || MONGO_URI === 'PASTE_YOUR_ATLAS_URI_HERE') {
  console.error('❌ MONGO_URI is not set in your .env file!');
  console.error('   Open .env and paste your MongoDB Atlas connection string.');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4,
})
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('⚠️ Server will continue to run, but database operations will fail.');
  });

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is unavailable right now. Check MongoDB connectivity and try again.',
    });
  }
  next();
});

const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

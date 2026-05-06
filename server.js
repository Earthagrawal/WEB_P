require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI || MONGO_URI === 'PASTE_YOUR_ATLAS_URI_HERE') {
  console.error('❌ MONGO_URI is not set in your .env file!');
  console.error('   Open .env and paste your MongoDB Atlas connection string.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('⚠️ Server will continue to run, but database operations will fail.');
  });

const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

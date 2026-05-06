require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Course = require('./models/Course');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

async function exportData() {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI is not defined in .env");
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for Export');

    console.log('⏳ Fetching data from database...');
    const courses = await Course.find({});
    const users = await User.find({});

    const data = {
      courses: courses,
      users: users
    };

    fs.writeFileSync('./database_backup.json', JSON.stringify(data, null, 2));
    console.log('📦 Successfully exported data to database_backup.json!');
    console.log(`📊 Total Exported: ${courses.length} courses and ${users.length} users.`);

  } catch (err) {
    console.error('❌ Export failed:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

exportData();

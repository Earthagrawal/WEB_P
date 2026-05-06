require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Course = require('./models/Course');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

async function importData() {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI is not defined in .env");
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for Import');

    if (!fs.existsSync('./database_backup.json')) {
        throw new Error("database_backup.json not found! Please make sure the file is in the same folder as this script.");
    }

    console.log('⏳ Reading data from database_backup.json...');
    const rawData = fs.readFileSync('./database_backup.json');
    const data = JSON.parse(rawData);

    if (data.courses && data.courses.length > 0) {
        await Course.deleteMany({});
        await Course.insertMany(data.courses);
        console.log(`🌱 Imported ${data.courses.length} courses.`);
    }

    if (data.users && data.users.length > 0) {
        await User.deleteMany({});
        await User.insertMany(data.users);
        console.log(`👥 Imported ${data.users.length} users.`);
    }

    console.log('🎉 Database successfully imported!');

  } catch (err) {
    console.error('❌ Import failed:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

importData();

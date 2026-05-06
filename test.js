const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Course = require('./models/Course');
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/courseReg').then(async () => {
  const user = await User.findOne({ studentId: '24UCS100' });
  if (user) {
    console.log('User found:', user.studentId);
    console.log('calcBranch:', user.calculatedBranch);
    console.log('calcYear:', user.calculatedYearLevel);
    console.log('calcSem:', user.calculatedSemester);
    const filter = {
        targetYear: { $in: ['ALL', user.calculatedYearLevel] },
        targetSemester: { $in: ['ALL', user.calculatedSemester] },
        targetBranch: { $in: ['ALL', user.calculatedBranch] }
    };
    console.log('Filter:', filter);
    const courses = await Course.find(filter);
    console.log('Courses found:', courses.length);
  } else {
    console.log('User not found');
  }
  process.exit(0);
});

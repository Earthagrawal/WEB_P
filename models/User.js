const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^(\d{2}(UCS|DCS|UEC|DEC|UME|UCC)\d{3}|ADM\d{3})$/i, 'Use valid roll number (24UCS097) or admin ID (ADM123)'],
    validate: {
      validator(value) {
        if (/^ADM\d{3}$/i.test(value)) {
          return true;
        }
        const trailingDigits = parseInt(value.slice(-3), 10);
        return trailingDigits > 0;
      },
      message: 'Roll number last 3 digits must be between 001 and 999',
    },
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@lnmiit\.ac\.in$/i, 'Please enter a valid college email address (yourname@lnmiit.ac.in)'],
  },
  department: {
    type: String,
    trim: true,
    default: 'Undeclared',
  },
  year: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
  },
  maxCredits: {
    type: Number,
    default: 20,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
}, { timestamps: true });

// Virtual: full label
userSchema.virtual('label').get(function () {
  return `${this.studentId} — ${this.name}`;
});

// Virtual: batchYear extracted from studentId (e.g. "24ucs082" -> "24")
userSchema.virtual('batchYear').get(function () {
  // Extract the first 2 digits of the student ID
  const match = this.studentId.match(/^(\d{2})/);
  return match ? match[1] : 'UNKNOWN';
});

// Virtual: calculatedBranch extracted from studentId (e.g. "24ucs" -> "CSE")
userSchema.virtual('calculatedBranch').get(function () {
  const match = this.studentId.toLowerCase().match(/^\d{2}u(cs|ce|ec|me|cc)/);
  if (match) {
    const b = match[1].toUpperCase();
    if (b === 'CS') return 'CSE';
    if (b === 'CC') return 'CCE';
    if (b === 'EC') return 'ECE';
    if (b === 'ME') return 'ME';
    return b;
  }
  return 'ALL';
});

// Virtual: calculatedYearLevel
userSchema.virtual('calculatedYearLevel').get(function () {
  const match = this.studentId.match(/^(\d{2})/);
  if (match) {
    const joinYear = 2000 + parseInt(match[1]); // e.g. 2024
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11

    // The academic year typically starts in August (month 7)
    // If the current month is before August (Jan-July), we are still in the academic year that started last year.
    let academicYear = currentYear;
    if (currentMonth < 7) {
      academicYear = currentYear - 1;
    }
    
    let yearLevel = academicYear - joinYear + 1;
    
    // Clamp to valid range
    if (yearLevel < 1) yearLevel = 1;
    if (yearLevel > 5) yearLevel = 5;
    
    return yearLevel.toString();
  }
  return this.year ? this.year.toString() : '1';
});

// Virtual: calculatedSemester (Odd/Even based on current month)
userSchema.virtual('calculatedSemester').get(function () {
  const month = new Date().getMonth(); // 0-11
  return (month >= 0 && month <= 5) ? 'Even' : 'Odd';
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

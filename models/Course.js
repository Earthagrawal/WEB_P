const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  instructor: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
  },
  enrolledCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  credits: {
    type: Number,
    default: 3,
    min: 1,
  },
  targetYear: {
    type: String,
    enum: ['1', '2', '3', '4', '5', 'ALL'],
    default: 'ALL',
  },
  targetSemester: {
    type: String,
    enum: ['Odd', 'Even', 'ALL'],
    default: 'ALL',
  },
  targetBranch: {
    type: [String],
    default: ['ALL']
  },
  courseType: {
    type: String,
    enum: ['MANDATORY', 'ELECTIVE', 'OPEN_ELECTIVE'],
    default: 'ELECTIVE',
  },
}, { timestamps: true });

// Virtual: available seats
courseSchema.virtual('availableSeats').get(function () {
  return this.totalSeats - this.enrolledCount;
});

// Virtual: isFull
courseSchema.virtual('isFull').get(function () {
  return this.enrolledCount >= this.totalSeats;
});

courseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);

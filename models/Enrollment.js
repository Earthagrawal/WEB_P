const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  status: {
    type: String,
    enum: ['ENROLLED', 'WAITLISTED'],
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  waitlistPosition: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

// Compound unique index — prevents duplicate enrollments at the DB level
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Index for efficient waitlist queries
enrollmentSchema.index({ courseId: 1, status: 1, waitlistPosition: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

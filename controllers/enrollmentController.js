const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// ─── GET /api/courses ────────────────────────────────────────────────────────
exports.getCourses = async (req, res) => {
  try {
    let filter = {};
    if (req.user && req.user.role !== 'admin') {
      filter = {
        targetYear: { $in: ['ALL', req.user.calculatedYearLevel] },
        targetSemester: { $in: ['ALL', req.user.calculatedSemester] },
        targetBranch: { $in: ['ALL', req.user.calculatedBranch] }
      };
    }
    const courses = await Course.find(filter).sort({ courseType: -1, courseCode: 1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/courses/:id ────────────────────────────────────────────────────
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/student/:id ────────────────────────────────────────────────────
exports.getStudentEnrollments = async (req, res) => {
  try {
    const studentId = req.params.id.toUpperCase();
    const enrollments = await Enrollment.find({ studentId })
      .populate('courseId')
      .sort({ enrolledAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/courses/:id/waitlist ───────────────────────────────────────────
exports.getWaitlist = async (req, res) => {
  try {
    const waitlist = await Enrollment.find({
      courseId: req.params.id,
      status: 'WAITLISTED',
    }).sort({ waitlistPosition: 1 });
    res.json({ success: true, data: waitlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/enroll ────────────────────────────────────────────────────────
exports.enroll = async (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({ success: false, message: 'studentId and courseId are required' });
  }

  const sid = studentId.toUpperCase().trim();

  // Start a MongoDB session for atomic transaction
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      // ── Look up the requested course type first ───────────────────────────
      const requestedCourse = await Course.findById(courseId).session(session);
      if (!requestedCourse) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
      }

      // ── Guard 1: Already enrolled or waitlisted in THIS course? ──────────
      const existing = await Enrollment.findOne({ studentId: sid, courseId }).session(session);
      if (existing) {
        const err = new Error(
          existing.status === 'ENROLLED'
            ? `Student ${sid} is already ENROLLED in this course`
            : `Student ${sid} is already WAITLISTED at position ${existing.waitlistPosition}`
        );
        err.statusCode = 409;
        err.data = existing;
        throw err;
      }

      // ── Guard 2: one seat-based selection per type (ELECTIVE / OPEN_ELECTIVE)
      if (requestedCourse.courseType === 'ELECTIVE' || requestedCourse.courseType === 'OPEN_ELECTIVE') {
        // Find all same-type courseIds (excluding this one)
        const allBatchElectives = await Course.find({
          _id: { $ne: courseId },
          courseType: requestedCourse.courseType,
        }).select('_id').session(session);
        const electiveCourseIds = allBatchElectives.map(c => c._id);

        const alreadyHasElective = await Enrollment.findOne({
          studentId: sid,
          courseId: { $in: electiveCourseIds },
          status: 'ENROLLED',
        }).session(session);

        if (alreadyHasElective) {
          const enrolledCourse = await Course.findById(alreadyHasElective.courseId).session(session);
          const label = requestedCourse.courseType === 'OPEN_ELECTIVE' ? 'open elective' : 'elective';
          const limitMessage = requestedCourse.courseType === 'OPEN_ELECTIVE'
            ? 'You can only select 1 open elective.'
            : 'You can only have one elective.';
          const err = new Error(
            `You are already enrolled in an ${label}: "${enrolledCourse ? enrolledCourse.title : 'another course'}". ${limitMessage} Please drop it first to select a different one.`
          );
          err.statusCode = 403;
          throw err;
        }
      }

      // ── Guard 3: Atomic seat grab ─────────────────────────────────────────
      const updatedCourse = await Course.findOneAndUpdate(
        { _id: courseId, $expr: { $lt: ['$enrolledCount', '$totalSeats'] } },
        { $inc: { enrolledCount: 1 } },
        { session, new: true }
      );

      if (updatedCourse) {
        // ── Seat secured! Create enrollment ──────────────────────────────
        const enrollment = await Enrollment.create([{
          studentId: sid,
          courseId,
          status: 'ENROLLED',
          enrolledAt: new Date(),
        }], { session });

        result = {
          status: 201,
          body: {
            success: true,
            message: `🎉 Successfully enrolled in ${updatedCourse.title}`,
            enrollment: enrollment[0],
            course: updatedCourse,
          },
        };
      } else {
        // ── No seat available ─────────────────────────────────────────────
        let fallbackEnrolled = false;

        // Auto fallback logic for ELECTIVE courses:
        // If this elective is full AND only 1 other elective has seats → auto-assign
        if (requestedCourse.courseType === 'ELECTIVE' && req.user && req.user.role !== 'admin') {
          const availableElectives = await Course.find({
            _id: { $ne: courseId },
            courseType: 'ELECTIVE',
            targetYear: { $in: ['ALL', req.user.calculatedYearLevel] },
            targetSemester: { $in: ['ALL', req.user.calculatedSemester] },
            targetBranch: { $in: ['ALL', req.user.calculatedBranch] },
            $expr: { $lt: ['$enrolledCount', '$totalSeats'] }
          }).session(session);

          if (availableElectives.length === 1) {
            const fallbackCourse = availableElectives[0];
            const existingFallback = await Enrollment.findOne({ studentId: sid, courseId: fallbackCourse._id }).session(session);

            if (!existingFallback) {
              const updatedFallback = await Course.findOneAndUpdate(
                { _id: fallbackCourse._id, $expr: { $lt: ['$enrolledCount', '$totalSeats'] } },
                { $inc: { enrolledCount: 1 } },
                { session, new: true }
              );

              if (updatedFallback) {
                const enrollment = await Enrollment.create([{
                  studentId: sid,
                  courseId: fallbackCourse._id,
                  status: 'ENROLLED',
                  enrolledAt: new Date(),
                }], { session });

                result = {
                  status: 201,
                  body: {
                    success: true,
                    message: `"${requestedCourse.title}" is full. You have been automatically enrolled in the last available option: "${updatedFallback.title}"`,
                    enrollment: enrollment[0],
                    course: updatedFallback,
                    fallback: true,
                  },
                };
                fallbackEnrolled = true;
              }
            }
          }

          // Elective is full and more than 1 other option exists → tell student to pick another
          if (!fallbackEnrolled) {
            result = {
              status: 409,
              body: {
                success: false,
                message: `❌ "${requestedCourse.title}" is full. Please choose another elective option.`,
                course: requestedCourse,
                isFull: true,
              },
            };
            fallbackEnrolled = true; // prevent falling into the waitlist block below
          }
        }

        // ── Non-elective full courses → join waitlist ─────────────────────
        if (!fallbackEnrolled) {
          const lastInQueue = await Enrollment.findOne({
            courseId,
            status: 'WAITLISTED',
          })
            .sort({ waitlistPosition: -1 })
            .session(session);

          const position = lastInQueue ? lastInQueue.waitlistPosition + 1 : 1;

          const enrollment = await Enrollment.create([{
            studentId: sid,
            courseId,
            status: 'WAITLISTED',
            waitlistPosition: position,
            enrolledAt: new Date(),
          }], { session });

          result = {
            status: 202,
            body: {
              success: true,
              message: `⏳ Course full. Added to waitlist at position #${position}`,
              enrollment: enrollment[0],
              course: requestedCourse,
              waitlistPosition: position,
            },
          };
        }
      }
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        data: err.data,
      });
    }
    // Duplicate key error from MongoDB (belt-and-suspenders)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Student is already enrolled or waitlisted in this course',
      });
    }
    console.error('Enroll error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// ─── POST /api/drop ──────────────────────────────────────────────────────────
exports.drop = async (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({ success: false, message: 'studentId and courseId are required' });
  }

  const sid = studentId.toUpperCase().trim();
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      // ── Students cannot drop mandatory courses; admins can override ─────
      const courseCheck = await Course.findById(courseId).session(session);
      const isAdminRequest = req.user && req.user.role === 'admin';
      if (courseCheck && courseCheck.courseType === 'MANDATORY' && !isAdminRequest) {
        const err = new Error('You cannot drop a mandatory course.');
        err.statusCode = 403;
        throw err;
      }

      // ── Find existing enrollment ──────────────────────────────────────────
      const enrollment = await Enrollment.findOne({ studentId: sid, courseId }).session(session);

      if (!enrollment) {
        const err = new Error(`Student ${sid} is not enrolled or waitlisted in this course`);
        err.statusCode = 404;
        throw err;
      }

      if (enrollment.status === 'ENROLLED') {
        // ── Drop an ENROLLED student ──────────────────────────────────────
        await Enrollment.deleteOne({ _id: enrollment._id }).session(session);

        // Decrement enrolledCount
        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: -1 } }, { session });

        // ── Auto-promote first waitlisted student (FIFO) ──────────────────
        const nextInLine = await Enrollment.findOne({
          courseId,
          status: 'WAITLISTED',
        })
          .sort({ waitlistPosition: 1 })
          .session(session);

        let promoted = null;

        if (nextInLine) {
          // Atomically give them the seat
          const promotedCourse = await Course.findOneAndUpdate(
            { _id: courseId, $expr: { $lt: ['$enrolledCount', '$totalSeats'] } },
            { $inc: { enrolledCount: 1 } },
            { session, new: true }
          );

          if (promotedCourse) {
            // Update enrollment status to ENROLLED
            await Enrollment.findByIdAndUpdate(
              nextInLine._id,
              { status: 'ENROLLED', waitlistPosition: null, enrolledAt: new Date() },
              { session }
            );

            // Shift remaining waitlist positions down by 1
            await Enrollment.updateMany(
              { courseId, status: 'WAITLISTED', waitlistPosition: { $gt: nextInLine.waitlistPosition } },
              { $inc: { waitlistPosition: -1 } },
              { session }
            );

            promoted = nextInLine.studentId;
          }
        }

        const course = await Course.findById(courseId).session(session);

        result = {
          status: 200,
          body: {
            success: true,
            message: promoted
              ? `✅ ${sid} dropped. Seat auto-promoted to ${promoted}`
              : `✅ ${sid} successfully dropped from course`,
            droppedStudentId: sid,
            promotedStudentId: promoted,
            course,
          },
        };
      } else {
        // ── Drop a WAITLISTED student ─────────────────────────────────────
        const pos = enrollment.waitlistPosition;
        await Enrollment.deleteOne({ _id: enrollment._id }).session(session);

        // Shift remaining waitlist positions above this one down by 1
        await Enrollment.updateMany(
          { courseId, status: 'WAITLISTED', waitlistPosition: { $gt: pos } },
          { $inc: { waitlistPosition: -1 } },
          { session }
        );

        const course = await Course.findById(courseId).session(session);

        result = {
          status: 200,
          body: {
            success: true,
            message: `✅ ${sid} removed from waitlist (was position #${pos})`,
            droppedStudentId: sid,
            course,
          },
        };
      }
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('Drop error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// ─── POST /api/courses (Admin: create course) ────────────────────────────────
exports.createCourse = async (req, res) => {
  try {
    const { courseCode, title, instructor, credits } = req.body;
    const normalizedCode = (courseCode || '').toString().trim().toUpperCase();
    const normalizedTitle = (title || '').toString().trim();
    const normalizedInstructor = (instructor || '').toString().trim();
    const parsedCredits = Number(credits);

    if (!/^(CS|CC|EC|ME)\d{3}$/.test(normalizedCode)) {
      return res.status(400).json({ success: false, message: 'Invalid course code. Use format like CS123, CC234, EC345, or ME456.' });
    }

    if (!/^(?!.*\d).{1,250}$/.test(normalizedTitle)) {
      return res.status(400).json({ success: false, message: 'Invalid course title. Numbers are not allowed and max length is 250.' });
    }

    if (!/^[A-Za-z. ]+$/.test(normalizedInstructor)) {
      return res.status(400).json({ success: false, message: 'Invalid instructor name. Only letters, spaces, and dot (.) are allowed.' });
    }

    if (Number.isNaN(parsedCredits) || parsedCredits < 1 || parsedCredits > 4.5 || (parsedCredits * 2) % 1 !== 0) {
      return res.status(400).json({ success: false, message: 'Invalid credits. Allowed values: 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5.' });
    }

    req.body.courseCode = normalizedCode;
    req.body.title = normalizedTitle;
    req.body.instructor = normalizedInstructor;
    req.body.credits = parsedCredits;

    const course = new Course(req.body);
    await course.save();
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Course code already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── GET /api/users ──────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ studentId: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/courses/:id/enrollments (Admin: who is in a course) ────────────
exports.getCourseEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ courseId: req.params.id })
      .sort({ status: 1, enrolledAt: 1 });
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

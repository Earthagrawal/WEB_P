const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendMandatoryEnrollEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const STUDENT_ROLL_REGEX = /^\d{2}(UCS|DCS|UEC|DEC|UME|UCC)\d{3}$/i;
const ADMIN_ID_REGEX = /^ADM\d{3}$/i;
const COLLEGE_EMAIL_REGEX = /^[^\s@]+@lnmiit\.ac\.in$/i;
const ADMIN_EMAIL_REGEX = /^adm\d{3}@lnmiit\.ac\.in$/i;
const STUDENT_EMAIL_REGEX = /^\d{2}(ucs|dcs|uec|dec|ume|ucc)\d{3}@lnmiit\.ac\.in$/i;

const isValidStudentRollNumber = (rollNumber) => {
  if (!rollNumber || !STUDENT_ROLL_REGEX.test(rollNumber)) {
    return false;
  }
  const trailingDigits = parseInt(rollNumber.slice(-3), 10);
  return trailingDigits > 0;
};

const isStrongPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8 || password.length > 15) {
    return false;
  }

  const checks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*()_+\-=:;'<>?{}|]/.test(password),
  ];

  return checks.filter(Boolean).length >= 3;
};

const isValidAdminId = (adminId) => ADMIN_ID_REGEX.test(adminId || '');

exports.signup = async (req, res) => {
  try {
    const { studentId, name, email, department, password, role } = req.body;
    const normalizedRollNumber = studentId ? studentId.toUpperCase().trim() : '';

    // Validate
    if (!studentId || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const userRole = role === 'admin' ? 'admin' : 'student';

    if (userRole === 'student' && !isValidStudentRollNumber(normalizedRollNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roll number format. Use: 2 digits + one of UCS/DCS/UEC/DEC/UME/UCC + 3 digits (001-999). Example: 24UCS097.',
      });
    }

    if (userRole === 'admin' && !isValidAdminId(normalizedRollNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin ID format. Use: ADM followed by 3 digits (example: ADM123).',
      });
    }

    if (!COLLEGE_EMAIL_REGEX.test(email || '')) {
      return res.status(400).json({
        success: false,
        message: 'Use your college email in this format: yourname@lnmiit.ac.in',
      });
    }

    if (userRole === 'student' && !STUDENT_EMAIL_REGEX.test(email || '')) {
      return res.status(400).json({
        success: false,
        message: 'Student email must be in roll-number format, e.g. 24ucs097@lnmiit.ac.in',
      });
    }

    if (userRole === 'admin' && !ADMIN_EMAIL_REGEX.test(email || '')) {
      return res.status(400).json({
        success: false,
        message: 'Admin email must be in admin-id format, e.g. adm345@lnmiit.ac.in',
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8-15 characters and include at least 3 of: uppercase, lowercase, number, special character.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ studentId: normalizedRollNumber }, { email: email.toLowerCase() }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Roll number or Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      studentId: normalizedRollNumber,
      name,
      email: email.toLowerCase(),
      department,
      password: hashedPassword,
      role: userRole,
    });

    await user.save();

    res.status(201).json({ success: true, message: 'Account created successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { studentId, password, role } = req.body;
    const sid = studentId ? studentId.toUpperCase().trim() : '';

    if (!studentId || !password) {
      return res.status(400).json({ success: false, message: 'Roll number and Password are required' });
    }

    if (role !== 'admin' && !isValidStudentRollNumber(sid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roll number format. Use: 2 digits + one of UCS/DCS/UEC/DEC/UME/UCC + 3 digits (001-999).',
      });
    }

    if (role === 'admin' && !isValidAdminId(sid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin ID format. Use: ADM followed by 3 digits (example: ADM123).',
      });
    }

    // Check if user exists
    const user = await User.findOne({ studentId: sid });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify role matches what the user selected on the frontend
    if (role && user.role !== role) {
      return res.status(401).json({ 
        success: false, 
        message: `Account mismatch. You are registered as a ${user.role}, but tried to login as a ${role}.` 
      });
    }

    // Generate JWT
    const payload = {
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      role: user.role,
      year: user.calculatedYearLevel,
      branch: user.calculatedBranch,
      semester: user.calculatedSemester
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    // Auto-enroll in MANDATORY courses for their batch
    let autoEnrolledCourses = [];
    if (user.role !== 'admin') {
      const Course = require('../models/Course');
      const Enrollment = require('../models/Enrollment');
      
      const mandatoryCourses = await Course.find({
        courseType: 'MANDATORY',
        targetYear: { $in: ['ALL', user.calculatedYearLevel] },
        targetSemester: { $in: ['ALL', user.calculatedSemester] },
        targetBranch: { $in: ['ALL', user.calculatedBranch] }
      });

      for (const course of mandatoryCourses) {
        const exists = await Enrollment.findOne({ studentId: sid, courseId: course._id });
        if (!exists) {
          await Enrollment.create({
            studentId: sid,
            courseId: course._id,
            status: 'ENROLLED',
            enrolledAt: new Date()
          });
          await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });
          autoEnrolledCourses.push({ courseCode: course.courseCode, title: course.title });
        }
      }
    }

    // Send notification about mandatory auto-enrollments (async)
    (async () => {
      try {
        if (autoEnrolledCourses.length > 0 && user.email) {
          await sendMandatoryEnrollEmail({ to: user.email, name: user.name, studentId: sid, courses: autoEnrolledCourses });
        }
      } catch (err) {
        console.error('Failed to send mandatory enroll email:', err);
      }
    })();

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: payload,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, please log in' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

// Middleware to restrict to admins
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  }
};

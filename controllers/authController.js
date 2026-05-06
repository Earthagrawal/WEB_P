const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

exports.signup = async (req, res) => {
  try {
    const { studentId, name, email, department, password, role } = req.body;

    // Validate
    if (!studentId || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ studentId: studentId.toUpperCase() }, { email: email.toLowerCase() }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Student ID or Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default role to student, unless 'admin' is explicitly passed (this is simple for now)
    const userRole = role === 'admin' ? 'admin' : 'student';

    // Create user
    const user = new User({
      studentId: studentId.toUpperCase(),
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

    if (!studentId || !password) {
      return res.status(400).json({ success: false, message: 'Student ID and Password are required' });
    }

    const sid = studentId.toUpperCase();

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
        }
      }
    }

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

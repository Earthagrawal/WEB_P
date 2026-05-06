const router = require('express').Router();
const ctrl = require('../controllers/enrollmentController');
const authCtrl = require('../controllers/authController');

// Auth routes
router.post('/signup', authCtrl.signup);
router.post('/login', authCtrl.login);

// Course routes
router.get('/courses', authCtrl.protect, ctrl.getCourses);
router.post('/courses', authCtrl.protect, authCtrl.adminOnly, ctrl.createCourse);
router.get('/courses/:id', ctrl.getCourseById);
router.get('/courses/:id/waitlist', ctrl.getWaitlist);
router.get('/courses/:id/enrollments', authCtrl.protect, authCtrl.adminOnly, ctrl.getCourseEnrollments);

// Enrollment routes (Protected)
router.post('/enroll', authCtrl.protect, ctrl.enroll);
router.post('/drop', authCtrl.protect, ctrl.drop);

// Student routes (Protected)
router.get('/student/:id', authCtrl.protect, ctrl.getStudentEnrollments);

// Users routes (Protected, Admin only)
router.get('/users', authCtrl.protect, authCtrl.adminOnly, ctrl.getUsers);

module.exports = router;

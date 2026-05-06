require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/courseReg';

const seedCourses = [
  // 1st Semester (Common)
  { courseCode: 'PH111', title: 'Classical Physics', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '1', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'MT111', title: 'Calculus and Ordinary Differential Equations', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '1', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'EC111', title: 'Basic Electronics', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '1', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'EC111L', title: 'Basic Electronics Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '1', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'CS111', title: 'Programming for Problem Solving', instructor: 'TBA', totalSeats: 100, credits: 4.5, targetYear: '1', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'HS111', title: 'Technical Communication in English', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '1', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'HS112', title: 'Indian Knowledge System', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '1', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },

  // 2nd Semester (Common to ALL or shared across multiple)
  { courseCode: 'HS121', title: 'Human Values and Ethics', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '1', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'ME121', title: 'Environmental Science', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '1', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'MT121', title: 'Linear Algebra and Complex Analysis', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '1', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'CS121', title: 'Data Structures and Algorithms', instructor: 'TBA', totalSeats: 100, credits: 4.5, targetYear: '1', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'PH121L', title: 'UG Physics Laboratory', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '1', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'CS122', title: 'Introduction to Scripting Languages', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '1', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'CS123', title: 'Digital Systems', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '1', targetSemester: 'Even', targetBranch: ['CSE', 'CCE'], courseType: 'MANDATORY' }, // Shared CSE/CCE
  { courseCode: 'CS124', title: 'Discrete Mathematics', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '1', targetSemester: 'Even', targetBranch: ['CSE', 'CCE'], courseType: 'MANDATORY' }, // Shared CSE/CCE
  
  // 2nd Semester (ECE Only)
  { courseCode: 'EC121', title: 'Semiconductor Devices and Circuits', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '1', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC122', title: 'Analog Electronics', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '1', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC122L', title: 'Analog Electronics Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '1', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },

  // 2nd Semester (ME Only)
  { courseCode: 'ME122', title: 'Introduction to Mechanical Engineering', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '1', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME123', title: 'Engineering Drawing and Graphics', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '1', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME124', title: 'Workshop Practices', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '1', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME125', title: 'Engineering Physical Metallurgy', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '1', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },

  // 3rd Semester (Common or Shared)
  { courseCode: 'MT211', title: 'Probability and Statistics', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'EC211', title: 'Signals and Systems', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' }, // Note: CCE uses EC212
  { courseCode: 'CS213', title: 'Database Management Systems', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: ['CSE', 'CCE'], courseType: 'MANDATORY' }, // Shared CSE/CCE
  { courseCode: 'CS214', title: 'Object Oriented Programming', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: ['CSE', 'CCE'], courseType: 'MANDATORY' }, // Shared CSE/CCE
  { courseCode: 'CS215', title: 'Design and Analysis of Algorithms', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: ['CSE', 'CCE'], courseType: 'MANDATORY' }, // Shared CSE/CCE
  
  // 3rd Semester (CSE Only)
  { courseCode: 'CS211', title: 'Computer Organization and Architecture', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: 'CSE', courseType: 'MANDATORY' }, // CCE uses CS212
  
  // 3rd Semester (CCE Only)
  { courseCode: 'EC212', title: 'Signals and Systems', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: 'CCE', courseType: 'MANDATORY' },
  { courseCode: 'CS212', title: 'Computer Organization and Architecture', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Odd', targetBranch: 'CCE', courseType: 'MANDATORY' },

  // 3rd Semester (ECE Only)
  { courseCode: 'EC211L', title: 'Signals and Systems Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC213', title: 'Digital Circuit and Systems', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC213L', title: 'Digital Circuit and Systems Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC214', title: 'Engineering Electromagnetics', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC215', title: 'Microprocessor and Microcontroller', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC215L', title: 'Microprocessor and Microcontroller Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC216', title: 'Network Analysis and Synthesis', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'MANDATORY' },

  // 3rd Semester (ME Only)
  { courseCode: 'ME211', title: 'Mechanics of Solids', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME212', title: 'Rigid Body Dynamics', instructor: 'TBA', totalSeats: 100, credits: 2, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME213', title: 'Engineering Thermodynamics', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME214', title: 'Welding and Casting', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME215', title: 'Electrical Technology', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },

  // 4th Semester (Common or Shared)
  { courseCode: 'HS221', title: 'Constitutional Studies', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '2', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'CS221', title: 'Web Programming', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '2', targetSemester: 'Even', targetBranch: ['CSE'], courseType: 'MANDATORY' }, // CSE Only
  { courseCode: 'CS223', title: 'Operating Systems', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Even', targetBranch: ['CSE', 'CCE'], courseType: 'MANDATORY' }, // Shared CSE/CCE
  { courseCode: 'EC221', title: 'Analog and Digital Communication', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: ['ECE', 'CCE'], courseType: 'MANDATORY' }, // Shared ECE/CCE
  { courseCode: 'EC221L', title: 'Analog and Digital Communication Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '2', targetSemester: 'Even', targetBranch: ['ECE', 'CCE'], courseType: 'MANDATORY' }, // Shared ECE/CCE
  
  // 4th Semester (CSE Only)
  { courseCode: 'HS222', title: 'Principles of Management', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'MANDATORY' },
  { courseCode: 'CS222', title: 'Theory of Computation', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'MANDATORY' },
  { courseCode: 'CS224', title: 'Computer Networks', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'MANDATORY' },
  { courseCode: 'CS225', title: 'Data Science', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'MANDATORY' },
  { courseCode: 'CSE-PE1', title: 'Program Elective 1', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'ELECTIVE' },
  
  // 4th Semester (ECE Only)
  { courseCode: 'EC222', title: 'Fundamentals of VLSI', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC222L', title: 'VLSI Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '2', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC223', title: 'Microwave Engineering', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC223L', title: 'Microwave Engineering Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '2', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'EC224L', title: 'Design and Project Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '2', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'CC321-ECE', title: 'Introduction to AI and ML', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Even', targetBranch: ['ECE'], courseType: 'MANDATORY' },

  // 4th Semester (CCE Only)
  { courseCode: 'CC221-CCE', title: 'Computer Communication Networks', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Even', targetBranch: ['CCE'], courseType: 'MANDATORY' },
  { courseCode: 'CC222', title: 'Embedded Systems and IoT', instructor: 'TBA', totalSeats: 100, credits: 4.5, targetYear: '2', targetSemester: 'Even', targetBranch: 'CCE', courseType: 'MANDATORY' },

  // 4th Semester (ME Only)
  { courseCode: 'ME221', title: 'Design of Machine Elements', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME222', title: 'Fluid Mechanics and Machinery', instructor: 'TBA', totalSeats: 100, credits: 5, targetYear: '2', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME223', title: 'Machining and Metal Forming', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME224', title: 'Mechanisms and Machines', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '2', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME225', title: 'Introduction to Computational Methods', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '2', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME226', title: 'Industrial Measurements', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '2', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },

  // 5th Semester (Common or Shared)
  { courseCode: 'LN311', title: 'Summer Internship/Project', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'HS311', title: 'Psychology, Technology & Society', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'EC311', title: 'Wireless Communication', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: ['ECE', 'CCE'], courseType: 'MANDATORY' }, // Shared ECE/CCE
  { courseCode: 'EC311L', title: 'Wireless Communication lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '3', targetSemester: 'Odd', targetBranch: ['ECE', 'CCE'], courseType: 'MANDATORY' }, // Shared ECE/CCE
  { courseCode: 'CS311', title: 'Software Engineering', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: ['CSE', 'CCE'], courseType: 'MANDATORY' }, // Shared CSE/CCE
  { courseCode: 'EC313', title: 'Digital Signal Processing', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: ['ECE', 'CCE'], courseType: 'MANDATORY' }, // Shared ECE/CCE
  { courseCode: 'EC313L', title: 'Digital Signal Processing Lab', instructor: 'TBA', totalSeats: 100, credits: 1.5, targetYear: '3', targetSemester: 'Odd', targetBranch: ['ECE', 'CCE'], courseType: 'MANDATORY' }, // Shared ECE/CCE
  { courseCode: 'CS314', title: 'Software Development Lab', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '3', targetSemester: 'Odd', targetBranch: ['CSE', 'CCE'], courseType: 'MANDATORY' }, // Shared CSE/CCE

  // 5th Semester (CSE Only)
  { courseCode: 'CS312', title: 'Artificial Intelligence', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Odd', targetBranch: 'CSE', courseType: 'MANDATORY' },
  { courseCode: 'CS313', title: 'Computer System Security', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Odd', targetBranch: 'CSE', courseType: 'MANDATORY' },
  { courseCode: 'CSE-PE2', title: 'Program Elective 2', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: 'CSE', courseType: 'ELECTIVE' },
  
  // 5th Semester (ECE Only)
  { courseCode: 'EC312', title: 'Control System Engineering', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'ECE-PE1', title: 'Program Elective 1', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'ELECTIVE' },

  // 5th Semester (CCE Only)
  { courseCode: 'CCE-PE2', title: 'Program Elective 2', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: 'CCE', courseType: 'ELECTIVE' },

  // 5th Semester (ME Only)
  { courseCode: 'ME311', title: 'Heat Transfer', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME312', title: 'Design of Transmission Elements', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME313', title: 'Digital Manufacturing', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME314', title: 'Robotics and Control', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME315', title: 'Mechatronics & IoT', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'MANDATORY' },

  // 6th Semester (Common or Shared)
  { courseCode: 'LN321', title: 'B.Tech. Project (BTP)', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'HS321', title: 'Introduction to Economics', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'LN322', title: 'Seminar and Presentation Skills', instructor: 'TBA', totalSeats: 100, credits: 1, targetYear: '3', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'MANDATORY' },
  { courseCode: 'CC221-ECE', title: 'Computer Communication Networks', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Even', targetBranch: ['ECE'], courseType: 'MANDATORY' }, // ECE 6th Sem
  { courseCode: 'CC321-CCE', title: 'Introduction to AI and ML', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Even', targetBranch: ['CCE'], courseType: 'MANDATORY' }, // CCE 6th Sem
  
  // 6th Semester (CSE Only)
  { courseCode: 'MT321', title: 'Numerical Analysis and Scientific Computing', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'MANDATORY' },
  { courseCode: 'CSE-PE3', title: 'Program Elective 3', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'ELECTIVE' },
  { courseCode: 'CSE-PE4', title: 'Program Elective 4', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'ELECTIVE' },
  { courseCode: 'OE-CSE6', title: 'Open Elective', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'CSE', courseType: 'ELECTIVE' },
  
  // 6th Semester (ECE Only)
  { courseCode: 'EC321', title: '5G Wireless Systems and beyond', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'MANDATORY' },
  { courseCode: 'ECE-PE2', title: 'Program Elective 2', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'ELECTIVE' },
  { courseCode: 'ECE-PE3', title: 'Program Elective 3', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'ELECTIVE' },
  { courseCode: 'OE-ECE6', title: 'Open Elective', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'ECE', courseType: 'ELECTIVE' },

  // 6th Semester (CCE Only)
  { courseCode: 'EC-ITC', title: 'Information Theory and Coding', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'CCE', courseType: 'MANDATORY' },
  { courseCode: 'EC-CSE', title: 'Control System Engineering', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'CCE', courseType: 'MANDATORY' },
  { courseCode: 'CCE-PE3', title: 'Program Elective 3', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'CCE', courseType: 'ELECTIVE' },

  // 6th Semester (ME Only)
  { courseCode: 'ME321', title: 'IC Engines', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '3', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME322', title: 'Finite Element Methods', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME323', title: 'Industrial Engineering and Management', instructor: 'TBA', totalSeats: 100, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'ME', courseType: 'MANDATORY' },
  { courseCode: 'ME-PE1', title: 'Program Elective 1', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '3', targetSemester: 'Even', targetBranch: 'ME', courseType: 'ELECTIVE' },

  // 7th Semester (Common)
  { courseCode: 'LN411', title: 'B.Tech. Project (BTP)', instructor: 'TBA', totalSeats: 100, credits: 4, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'MANDATORY' },
  
  // 7th Semester (CSE Only)
  { courseCode: 'CSE-PE5', title: 'Program Elective 5', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'CSE', courseType: 'ELECTIVE' },
  { courseCode: 'CSE-PE6', title: 'Program Elective 6', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'CSE', courseType: 'ELECTIVE' },
  
  // 7th Semester (ECE Only)
  { courseCode: 'ECE-PE4', title: 'Program Elective 4', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'ELECTIVE' },
  { courseCode: 'ECE-PE5', title: 'Program Elective 5', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ECE', courseType: 'ELECTIVE' },

  // 7th Semester (CCE Only)
  { courseCode: 'CCE-PE4', title: 'Program Elective 4', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'CCE', courseType: 'ELECTIVE' },
  { courseCode: 'CCE-PE5', title: 'Program Elective 5', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'CCE', courseType: 'ELECTIVE' },

  // 7th Semester (ME Only)
  { courseCode: 'ME-PE2', title: 'Program Elective 2', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'ELECTIVE' },
  { courseCode: 'ME-PE3', title: 'Program Elective 3', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'ELECTIVE' },
  { courseCode: 'ME-PE4', title: 'Program Elective 4', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ME', courseType: 'ELECTIVE' },

  // Open Electives (Shared across branches)
  { courseCode: 'OE1', title: 'Open Elective 1', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'ELECTIVE' },
  { courseCode: 'OE2', title: 'Open Elective 2', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'ELECTIVE' },
  { courseCode: 'OE3', title: 'Open Elective 3', instructor: 'TBA', totalSeats: 50, credits: 3, targetYear: '4', targetSemester: 'Odd', targetBranch: 'ALL', courseType: 'ELECTIVE' },

  // 8th Semester Options (Common to ALL branches)
  { courseCode: 'LN421', title: 'Industrial SLI', instructor: 'TBA', totalSeats: 100, credits: 12, targetYear: '4', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'ELECTIVE' },
  { courseCode: 'LN422', title: 'Thesis', instructor: 'TBA', totalSeats: 100, credits: 12, targetYear: '4', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'ELECTIVE' },
  { courseCode: 'LN423', title: 'Project', instructor: 'TBA', totalSeats: 100, credits: 6, targetYear: '4', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'ELECTIVE' },
  { courseCode: 'LN424', title: 'Internship', instructor: 'TBA', totalSeats: 100, credits: 6, targetYear: '4', targetSemester: 'Even', targetBranch: 'ALL', courseType: 'ELECTIVE' },
];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    await Course.deleteMany({});
    console.log('🗑️  Cleared existing courses');
    const preservedCourses = seedCourses.filter((course) => !course.courseCode.startsWith('OE'));
    preservedCourses.forEach(c => {
      if (c.courseType === 'ELECTIVE') {
        c.credits = 3;
      }
    });

    const openElectives = [
      { courseCode: 'OE-DSA', title: 'DSA with Python', instructor: 'TBA', totalSeats: 50, credits: 2, targetYear: 'ALL', targetSemester: 'ALL', targetBranch: 'ALL', courseType: 'OPEN_ELECTIVE' },
      { courseCode: 'OE-HF', title: 'Health and Fitness', instructor: 'TBA', totalSeats: 50, credits: 2, targetYear: 'ALL', targetSemester: 'ALL', targetBranch: 'ALL', courseType: 'OPEN_ELECTIVE' },
    ];

    const finalSeedCourses = [...preservedCourses, ...openElectives];
    await Course.insertMany(finalSeedCourses);
    console.log(`🌱 Seeded ${finalSeedCourses.length} targeted courses for CSE, ECE, CCE, & ME branches.`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seedDB();

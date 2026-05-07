require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com';

let transporter = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  // Fallback: a noop transporter that logs to console
  transporter = {
    sendMail: async (opts) => {
      console.log('Email stub (SMTP not configured) — would send:', opts);
      return Promise.resolve(true);
    }
  };
}

function loadTemplate(name) {
  try {
    const tplPath = path.join(__dirname, '..', 'emails', 'templates', name + '.html');
    const textPath = path.join(__dirname, '..', 'emails', 'templates', name + '.txt');
    const html = fs.existsSync(tplPath) ? fs.readFileSync(tplPath, 'utf8') : '';
    const text = fs.existsSync(textPath) ? fs.readFileSync(textPath, 'utf8') : '';
    return { html, text };
  } catch (err) {
    return { html: '', text: '' };
  }
}

function render(template, vars) {
  let out = template;
  Object.keys(vars || {}).forEach(k => {
    const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    out = out.replace(re, vars[k] == null ? '' : vars[k]);
  });
  return out;
}

async function sendMail({ to, subject, templateName, vars = {}, attachments = [] }) {
  const tpl = loadTemplate(templateName);
  const html = render(tpl.html, vars) || undefined;
  const text = render(tpl.text, vars) || undefined;

  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject,
    text,
    html,
    attachments,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send email', err);
    throw err;
  }
}

// High-level helpers
async function sendEnrollmentEmail({ to, name, studentId, course }) {
  if (!to) return;
  const subject = `Enrollment Confirmed — ${course.courseCode}`;
  return sendMail({ to, subject, templateName: 'enrollment', vars: { name, studentId, courseCode: course.courseCode, courseTitle: course.title, instructor: course.instructor } });
}

async function sendWaitlistEmail({ to, name, studentId, course, position }) {
  if (!to) return;
  const subject = `Waitlisted — ${course.courseCode} (Position #${position})`;
  return sendMail({ to, subject, templateName: 'waitlist', vars: { name, studentId, courseCode: course.courseCode, courseTitle: course.title, position } });
}

async function sendPromotionEmail({ to, name, studentId, course }) {
  if (!to) return;
  const subject = `Promoted from Waitlist — ${course.courseCode}`;
  return sendMail({ to, subject, templateName: 'promotion', vars: { name, studentId, courseCode: course.courseCode, courseTitle: course.title } });
}

async function sendDropEmail({ to, name, studentId, course }) {
  if (!to) return;
  const subject = `Dropped — ${course.courseCode}`;
  return sendMail({ to, subject, templateName: 'drop', vars: { name, studentId, courseCode: course.courseCode, courseTitle: course.title } });
}

async function sendMandatoryEnrollEmail({ to, name, studentId, courses }) {
  if (!to) return;
  const subject = `Mandatory Courses Enrolled`;
  const courseList = (courses || []).map(c => `${c.courseCode} — ${c.title}`).join('\n');
  return sendMail({ to, subject, templateName: 'mandatory', vars: { name, studentId, courseList } });
}

module.exports = {
  sendMail,
  sendEnrollmentEmail,
  sendWaitlistEmail,
  sendPromotionEmail,
  sendDropEmail,
  sendMandatoryEnrollEmail,
};

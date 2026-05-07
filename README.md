# 🎓 Course Allotment Portal — Atomic Course Registration System

A **First-Come-First-Serve** student course registration system built with Node.js, Express, and MongoDB.  
Features **race-condition-proof** seat allocation using atomic MongoDB transactions and automatic waitlist promotion.

---

## 🌐 Live Deployment

- Vercel URL: [https://web-p-sigma.vercel.app/](https://web-p-sigma.vercel.app/)

---

## 📋 Prerequisites

Make sure the following are installed on your machine before proceeding:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18+ | https://nodejs.org |
| **MongoDB** | v6+ (Community) | https://www.mongodb.com/try/download/community |
| **npm** | v8+ (comes with Node.js) | — |

> **Verify your installs** by running in any terminal:
> ```bash
> node -v
> npm -v
> mongod --version
> ```

---

## 🚀 Quick Start (Step-by-Step)

### Step 1 — Install Dependencies

```bash
npm install
```

This installs `express`, `mongoose`, and `cors` from `package.json`.

---

### Step 3 — Start MongoDB

MongoDB must be running **before** you start the server.

**Option A — As a Windows Service (if installed as a service):**
```powershell
net start MongoDB
```

**Option B — Manually from terminal:**
```bash
mongod
```

> ✅ You should see: `Waiting for connections on port 27017`

---

### Step 4 — Seed the Database

Populate the database with **6 sample courses** (CS-101, CS-301, CS-401, CS-450, MATH-201, SE-310):

```bash
node seed.js
```

**Expected output:**
```
✅ Connected to MongoDB
🗑️  Cleared existing courses
🌱 Seeded 6 courses:
   • CS-101: Introduction to Computer Science (3 seats)
   • CS-301: Data Structures & Algorithms (2 seats)
   • CS-401: Database Systems (4 seats)
   • CS-450: Machine Learning (3 seats)
   • MATH-201: Discrete Mathematics (5 seats)
   • SE-310: Software Engineering (4 seats)

✅ Seed complete! Run: node server.js
```

> ⚠️ You only need to seed **once**. Re-running it will reset all enrollment data.

---

### Step 5 — Start the Server

```bash
node server.js
```

**Expected output:**
```
🚀 Server running on http://localhost:3000
✅ MongoDB connected
```

---

### Step 6 — Open the App

Open your browser and go to:

```
http://localhost:3000
```

---

## 🗂️ Project Structure

```
course-registration/
├── server.js                     ← Express app entry point
├── seed.js                       ← Populates DB with sample courses
├── package.json                  ← Project dependencies & scripts
│
├── config/
│   └── db.js                     ← MongoDB connection config
│
├── models/
│   ├── Course.js                 ← Course schema (totalSeats, enrolledCount…)
│   └── Enrollment.js             ← Enrollment schema (status, waitlistPosition…)
│
├── controllers/
│   └── enrollmentController.js   ← All business logic + atomic transactions
│
├── routes/
│   └── api.js                    ← REST API route definitions
│
└── public/                       ← Static frontend (served by Express)
    ├── index.html                ← Main UI
    ├── style.css                 ← Dark-mode styles
    └── app.js                    ← Frontend JavaScript (fetch API calls)
```

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/courses` | List all courses |
| `GET` | `/api/courses/:id` | Get a single course |
| `POST` | `/api/courses` | Create a new course (Admin) |
| `GET` | `/api/courses/:id/waitlist` | View waitlist for a course |
| `POST` | `/api/enroll` | Enroll a student (or waitlist if full) |
| `POST` | `/api/drop` | Drop a course (auto-promotes waitlist) |
| `GET` | `/api/student/:id` | Get all enrollments for a student |

### Example — Enroll a Student
```bash
curl -X POST http://localhost:3000/api/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId": "STU-001", "courseId": "<course_id>"}'
```

### Example — Drop a Course
```bash
curl -X POST http://localhost:3000/api/drop \
  -H "Content-Type: application/json" \
  -d '{"studentId": "STU-001", "courseId": "<course_id>"}'
```

---

## 🧪 Testing the System (Demo Walkthrough)

Use roll numbers like `24UCS097`, `23DCS082`, `24UEC101`, `24UCC112` to simulate multiple students.

**Try this scenario with CS-301 (only 2 seats):**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | STU-001 enrolls | ✅ Enrolled (1/2) |
| 2 | STU-002 enrolls | ✅ Enrolled (2/2) |
| 3 | STU-003 enrolls | ⏳ Waitlisted at #1 |
| 4 | STU-004 enrolls | ⏳ Waitlisted at #2 |
| 5 | STU-001 drops | ✅ STU-003 auto-promoted → Enrolled |
| 6 | STU-002 drops | ✅ STU-004 auto-promoted → Enrolled |

---

## ⚙️ NPM Scripts

```bash
npm start       # Start the server (node server.js)
npm run dev     # Start with auto-reload (nodemon server.js)
npm run seed    # Seed the database with sample courses
```

> To use `npm run dev`, nodemon is included as a dev dependency.

---

## 🛠️ Troubleshooting

### ❌ `connect ECONNREFUSED 127.0.0.1:27017`
MongoDB is not running. Start it with:
```bash
mongod
```
or
```powershell
net start MongoDB
```

### ❌ `Port 3000 already in use`
Something else is using port 3000. Kill it or change the port:
```bash
# Find and kill the process (Windows)
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### ❌ `Course code already exists` when seeding
The seed data already exists. Run seed again to reset:
```bash
node seed.js   # This clears and re-inserts all courses
```

### ❌ Waitlist not updating after drop
Make sure you're running **MongoDB 4.0+** (required for transactions). Check with:
```bash
mongod --version
```

---

## 🏗️ Architecture Overview

```
Browser (HTML + CSS + JS)
        │  fetch() → REST API
        ▼
Node.js + Express (port 3000)
        │  Mongoose ODM
        ▼
MongoDB (port 27017)
  ├── courses       collection
  └── enrollments   collection
```

**Key Design Decisions:**
- `enrolledCount` stored on the Course document → enables **atomic `$inc` operations**
- `findOneAndUpdate` with conditional filter → **single unbreakable read-check-write** (no race conditions)
- `session.withTransaction()` → **full rollback** if anything fails mid-enrollment
- Compound unique index on `{studentId, courseId}` → **DB-level duplicate prevention**
- `waitlistPosition` as integer → **clean FIFO reordering** with `$inc: -1` on drop

---

## 👨‍💻 Tech Stack

- **Backend:** Node.js · Express.js
- **Database:** MongoDB · Mongoose ODM
- **Frontend:** Vanilla HTML · CSS · JavaScript
- **Concurrency:** MongoDB Atomic Transactions (`session.withTransaction`)

---

## ✉️ Email (SMTP) & Environment Variables

This project can send email notifications (enrollment, waitlist, promotion, drop, mandatory auto-enroll). To enable email, provide SMTP credentials via environment variables. A ready `.env.example` is included.

Required environment variables (add to your `.env`):

MONGO_URI - MongoDB connection string (MongoDB Atlas or local)

PORT - Port to run the server (defaults to `3000`)

JWT_SECRET - Strong secret for signing JWTs (REQUIRED in production)

SMTP_HOST - SMTP server host (e.g. `smtp.mailtrap.io`, `smtp.gmail.com`, `smtp.sendgrid.net`)

SMTP_PORT - SMTP port (usually `587` for TLS, `465` for SSL)

SMTP_USER - SMTP username

SMTP_PASS - SMTP password (or app password for Gmail)

FROM_EMAIL - From address to show in outgoing emails (e.g. `no-reply@yourdomain.com`)

Where to get SMTP credentials:

- Mailtrap (recommended for testing): signup at https://mailtrap.io → Inboxes → SMTP settings. Use these values in `.env` for safe testing without sending real email.
- Gmail (personal/testing): enable 2FA and create an App Password in your Google Account → use `smtp.gmail.com`, port `587`, username your Gmail address, password the App Password. Note: Gmail may restrict bulk sending.
- SendGrid / Mailgun / Postmark: create a free account, use SMTP relay credentials from their dashboard for production-like testing.
- Company/University SMTP: contact your IT/admin to request an SMTP relay account and credentials.

Notes & safety:

- If SMTP variables are not present the app will log email contents to the server console (safe fallback for demos).
- Do NOT commit real credentials to version control. Use `.env` locally and configure secrets in your hosting provider for production.
- `JWT_SECRET` must be unique and unpredictable — use an environment secret manager in deployment.

Quick example `.env` snippet:

MONGO_URI=mongodb://localhost:27017/courseReg
PORT=3000
JWT_SECRET=supersecretkey123
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
FROM_EMAIL=no-reply@yourdomain.com

After adding the variables, restart the server (`npm start` or `npm run dev`). The app will attempt to send emails for enroll/waitlist/promotion/drop and will log them if SMTP isn't configured.

---

## Mailtrap sandbox — sending to yourself

If you don't have a real domain, Mailtrap sandbox/inbox is perfect for testing. Use the SMTP credentials shown in your Mailtrap Inbox (SMTP tab) — the username is `api` and the password is your API token. Mailtrap will capture all outgoing messages into the sandbox inbox so you can inspect them.

Notes when using Mailtrap sandbox:
- `FROM_EMAIL` can be any email address (Mailtrap captures it; it doesn't need to be a verified domain).
- `SMTP_USER` should be `api` and `SMTP_PASS` should be the token shown in Mailtrap SMTP settings (or the token from API Tokens when using the API client).
- Mailtrap shows separate API and SMTP instructions; use SMTP for the repo's built-in `utils/email.js`.

Example `.env` values for Mailtrap SMTP (fill in your token):

SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=<YOUR_API_TOKEN>
FROM_EMAIL=no-reply@example.com

Quick sandbox test (replace recipient with your real address):
```bash
node -e "require('dotenv').config(); require('./utils/email').sendMail({ to:'you@domain.com', subject:'Mailtrap sandbox test', templateName:'enrollment', vars:{name:'Demo', courseCode:'CS101', courseTitle:'Intro', instructor:'Prof X'} }).then(()=>console.log('sent')).catch(console.error)"
```

Open your Mailtrap Inbox to view the captured message; it will show the `From`, `To`, subject, and message body exactly as sent.


---

## 💡 Suggested Improvements

- Add a `/api/health` endpoint (with DB status) so post-deploy issues are easier to detect quickly.
- Move all secrets (`MONGO_URI`, `JWT_SECRET`) to deployment environment variables only; keep `.env` out of git.
- Add role-based API tests for quick enroll/drop, mandatory drop rules, and open-elective limit enforcement.
- Add a small CI workflow (lint + basic API smoke tests) so broken deploys are caught before production.

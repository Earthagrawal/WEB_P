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

## 💡 Suggested Improvements

- Add a `/api/health` endpoint (with DB status) so post-deploy issues are easier to detect quickly.
- Move all secrets (`MONGO_URI`, `JWT_SECRET`) to deployment environment variables only; keep `.env` out of git.
- Add role-based API tests for quick enroll/drop, mandatory drop rules, and open-elective limit enforcement.
- Add a small CI workflow (lint + basic API smoke tests) so broken deploys are caught before production.

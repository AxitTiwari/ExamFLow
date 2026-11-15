# ExamFlow — University Examination & Resource Scheduling System

A complete local academic project with separate `database`, `backend`, and `frontend` folders.

## Technology
- Frontend: React 18, Vite, JavaScript, CSS
- Backend: Node.js, Express
- Database: MySQL 8, SQL tables, constraints, stored procedures
- Database driver: mysql2

## Important design choice
Database structure and application data operations are defined in SQL under `database/`.
Backend route files expose HTTP APIs and call SQL stored procedures. They do not create tables or keep a second schema in JavaScript.

This build uses simple local demo passwords without hashing/JWT, as requested. It is only suitable for local classroom demonstration. Do not expose it to the internet.

## Folder layout
```text
ExamFlow/
├── database/
│   ├── 01_schema.sql
│   ├── 02_procedures.sql
│   ├── 03_demo_data.sql
│   └── 04_test_queries.sql
├── backend/
│   ├── src/config/db.js
│   ├── src/routes/
│   ├── src/server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/components/
    ├── src/pages/
    ├── src/services/
    ├── src/App.jsx
    ├── src/main.jsx
    └── package.json
```

## Setup order

### 1. Database
Open MySQL Workbench and run these files in order:
1. `database/01_schema.sql`
2. `database/02_procedures.sql`
3. `database/03_demo_data.sql`
4. `database/04_test_queries.sql` (optional verification)

The database created is `examflow`. This does not delete or modify your old project database.

### 2. Backend
1. Copy `backend/.env.example` to `backend/.env`.
2. Enter your MySQL password in `DB_PASSWORD`.
3. Open a terminal in `backend`:
   ```bash
   npm install
   npm run dev
   ```
4. Check `http://localhost:5000/api/health`. It should report database connected.

### 3. Frontend
Open another terminal in `frontend`:
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Administrator | admin@examflow.local | Admin@123 |
| Student | student@examflow.local | Student@123 |
| Teacher (approved) | teacher@examflow.local | Teacher@123 |
| Teacher (pending) | pending@examflow.local | Teacher@123 |

The SQL demo-data script inserts these accounts and sample academic data. Passwords are stored as plain text for this local-only demonstration.

## Main workflow
1. Sign in as administrator.
2. Review dashboard counts and pending teacher applications.
3. Approve the pending teacher.
4. Create or review courses, branches, subjects, offerings and rooms.
5. Teachers submit date/time availability.
6. Administrator creates an exam session and adds subject offerings as exams.
7. Generate the draft using FCFS or Priority Scheduling.
8. Review scheduled and unscheduled exams.
9. Publish the timetable.
10. Sign in as a student or teacher to view the published timetable.

## Scheduling implementation
The `sp_generate_schedule` stored procedure:
- FCFS sorts by exam creation time and ID.
- Priority sorts by higher priority first, then creation time and ID.
- Checks room activity and capacity.
- Checks teacher approval and submitted availability.
- Prevents room and teacher overlaps.
- Prevents students with shared enrollments from receiving overlapping examinations.
- Tries dates across the session and time slots in 30-minute increments.
- Leaves exams without a valid allocation unscheduled and reports them.

This is a deterministic, greedy resource allocator, not a globally optimal mathematical solver.

## Troubleshooting
- If the API health endpoint says database disconnected, check that MySQL service is running and `.env` credentials/database name are correct.
- If a login fails, first rerun `03_demo_data.sql`; it uses `INSERT ... ON DUPLICATE KEY UPDATE` for the demo accounts.
- If timetable generation leaves exams unscheduled, verify teacher availability, active room capacity, session dates and daily hours.
- Do not change table/column names independently of the SQL procedures; the frontend and backend are aligned to this schema.

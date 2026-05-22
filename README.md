# TaskFlow — Full-Stack Task Management App

## Tech Stack
- **Frontend:** React, React Router, Socket.io-client, Axios
- **Backend:** Node.js, Express, Socket.io
- **Auth:** JWT, bcrypt, Passport.js (Google OAuth)
- **Database:** MySQL

---

## Setup Instructions (Windows)

### 1. Setup the Database
Open MySQL command line and run:
```sql
source C:/path/to/taskflow/backend/config/schema.sql
```
Or paste the contents of `backend/config/schema.sql` into MySQL Workbench and execute.

### 2. Configure Environment Variables
```
cd backend
copy .env.example .env
```
Open `.env` and fill in:
- `DB_PASSWORD` — MySQL root password
- `JWT_SECRET` — any long random string
- `SESSION_SECRET` — any long random string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console (optional, skip if not using OAuth)

### 3. Install & Run Backend
```
cd backend
npm install
npm run dev
```

### 4. Install & Run Frontend
Open a NEW terminal window:
```
cd frontend
npm install
npm start
```
Frontend runs on http://localhost:3000

---

## Features
- Email/password registration & login
- Google OAuth login
- Create & manage projects
- Kanban board (To Do / In Progress / Review / Done)
- Create, edit, delete tasks
- Assign tasks to team members
- Set priority and due dates
- Real-time updates via Socket.io (changes appear instantly for all team members)
- Comments on tasks
- Add/remove team members by email
- Live notifications when assigned to a task

## Google OAuth Setup
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Set Authorized redirect URI to: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Secret into your `.env` file

# TaskFlow — Architecture Decisions

**Phase 3 — System Architecture**
Prepared by: Andisatriawan (andisatriawancoderdev)
Date: 22 March 2026

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Web frontend | React.js + Tailwind CSS | Admin dashboard in browser |
| Web API calls | Axios | Send/receive data from backend |
| Mobile app | React Native + Expo | Android app for staff |
| Backend server | Node.js + Express | Handle all business logic |
| Authentication | JWT (JSON Web Token) | Secure login sessions |
| Database ORM | Prisma | Talk to database without raw SQL |
| Database | PostgreSQL | Store all users, tasks, data |
| Cloud hosting | Railway (free tier) | Deploy backend + database |
| File storage | Cloudinary (free tier) | Store uploaded files/images |

---

## Key Architecture Decisions

- **JavaScript everywhere** — React.js (web) and React Native (mobile) both use JavaScript, so only one language needs to be learned
- **REST API pattern** — all client-server communication uses HTTP requests to defined endpoints
- **JWT authentication** — stateless login tokens, checked on every request by the backend
- **Role-based access control** — admin sees all tasks, staff only sees their own. Enforced on the backend, never the frontend
- **Prisma ORM** — avoids writing raw SQL, queries read like plain English JavaScript
- **React never touches the database directly** — all data goes through the Express API

---

## How the System Connects

```
React.js (browser)  ──HTTPS──→  Express API  ──→  Prisma  ──→  PostgreSQL
React Native (phone) ──HTTPS──→  Express API  ──→  Prisma  ──→  PostgreSQL
```

Every request:
1. Carries a JWT token in the Authorization header
2. Is verified by Express middleware before processing
3. Goes through Prisma to read/write the database
4. Returns JSON data back to the client

---

## Database Tables

- **USERS** — stores admin and staff accounts with roles
- **TASKS** — core table with title, description, status, priority, due date, assigned staff
- **TASK_NOTES** — notes/comments left on tasks by staff or admin
- **TASK_FILES** — file attachments uploaded to tasks (URLs stored, files in Cloudinary)

---

## API Base URLs

- Development: `http://localhost:3000`
- Production: `https://taskflow-api.railway.app` (configured in Phase 6)

---

## Security Rules

- All endpoints except `/api/auth/login` require a valid JWT token
- Admin-only endpoints check role on the backend — not just the frontend
- Passwords stored as bcrypt hashes — never plain text
- Environment variables used for all secrets (database URL, JWT secret, Cloudinary keys)
- `.env` file is in `.gitignore` — never pushed to GitHub

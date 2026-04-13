# Coding Death Match

Coding Death Match, branded in the UI as `League of Coders`, is a real-time 1v1 competitive coding game. Players authenticate, join a queue, get matched into an arena, solve coding problems, and submit code against hidden test cases while the match updates live.

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Zustand
- Backend: Go 1.25, Gin, GORM
- Database: PostgreSQL
- Cache / queue state: Redis
- Code execution: Judge0
- Auth: email/password plus optional Google OAuth

## Project Structure

```text
.
├── frontend/   # Next.js app
├── backend/    # Go API
└── docker-compose.yml
```

## Prerequisites

Install these before running the project locally:

- Node.js 22+
- npm
- Go 1.25+
- PostgreSQL
- Redis
- Judge0

Notes:

- PostgreSQL is not included in `docker-compose.yml`; you must provide your own database.
- Judge0 is also not included in this repo; the backend calls an existing Judge0 instance through `JUDGE0_URL`.
- Redis is required for matchmaking and submission rate limiting.

## Environment Setup

### Backend

Create the backend env file:

```bash
cp backend/.env.example backend/.env
```

Minimum values to review in `backend/.env`:

```env
PORT=8080
JWT_SECRET=replace-this-with-a-long-random-secret

PGHOST=localhost
PGDATABASE=your_database_name
PGUSER=your_database_user
PGPASSWORD=your_database_password
PGSSLMODE=disable
PGCHANNELBINDING=

APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
AUTO_MIGRATE=true
REDIS_ADDR=localhost:6379
JUDGE0_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=
```

Optional Google OAuth values:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
```

If you do not need Google login yet, you can leave the Google values empty and use email/password auth.

### Frontend

Create a frontend env file:

```bash
cp frontend/.env.example frontend/.env.local
```

Default local value:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Running Locally

### 1. Start PostgreSQL

Run a PostgreSQL instance and make sure the credentials in `backend/.env` match it.

Important:

- The backend tries to run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.
- Your database user needs permission to create that extension, or it must already exist.
- For local Postgres, `PGSSLMODE=disable` is usually the right choice.

### 2. Start Redis

If you already have Redis, point `REDIS_ADDR` to it. Otherwise, a quick local option is:

```bash
docker run -d --name codingdeathmatch-redis -p 6379:6379 redis:7.2.4
```

### 3. Start Judge0

Run Judge0 separately and set `JUDGE0_URL` to its base URL, for example:

```env
JUDGE0_URL=http://localhost:2358
```

If Judge0 is not reachable, match submissions will fail.

### 4. Start the backend

From the `backend` directory:

```bash
go mod download
go run main.go
```

The API will start on `http://localhost:8080`.

There is also a dev helper script:

```bash
./start.sh
```

That script uses `nodemon`, so only use it if you already have `nodemon` installed.

### 5. Start the frontend

From the `frontend` directory:

```bash
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`.

### 6. Open the app

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:8080/health`

## Running With Docker Compose

This repo includes Docker support for:

- `frontend`
- `backend`
- `redis`

It does not spin up PostgreSQL or Judge0 for you.

### 1. Prepare env files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Update `backend/.env` with your real database and auth values.

### 2. Make sure external services exist

Before starting Docker Compose, make sure:

- PostgreSQL is reachable from the backend container
- Judge0 is reachable from the backend container

By default, `docker-compose.yml` points the backend to:

```env
JUDGE0_URL=http://host.docker.internal:2358
```

That works when Judge0 is running on your host machine. If your Judge0 lives somewhere else, override `JUDGE0_URL` before starting Compose.

### 3. Start the app

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:8080/health`

### 4. Stop the app

```bash
docker compose down
```

## Common Workflow

1. Register or log in from `/auth`
2. Join the queue from `/queue`
3. Wait for matchmaking
4. Solve the assigned problem in the match arena
5. Submit code and let Judge0 evaluate it

## Admin Notes

- Problem creation and editing routes are admin-only.
- New accounts default to the `user` role.
- If you want to use the admin screens, you will need an admin user in the database.

## Key Backend Routes

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/google/login`
- `GET /api/auth/google/callback`
- `POST /api/queue/join`
- `GET /api/queue/status`
- `GET /api/match/:id`
- `POST /api/match/:id/submit`

## Troubleshooting

### Backend exits on startup

Check:

- `backend/.env` exists
- `JWT_SECRET` is set
- PostgreSQL is reachable
- Redis is reachable

### CORS errors in the browser

Make sure `ALLOWED_ORIGINS` includes the frontend URL exactly, for example:

```env
ALLOWED_ORIGINS=http://localhost:3000
```

### Google login does not work

Make sure the redirect URI configured in Google matches this exactly:

```text
http://localhost:8080/api/auth/google/callback
```

### Code submissions fail

Check:

- `JUDGE0_URL` is correct
- Judge0 is running
- the backend can reach Judge0 from its own environment

## Deployment

There is also a short deployment-focused note in [DEPLOYMENT.md](./DEPLOYMENT.md).

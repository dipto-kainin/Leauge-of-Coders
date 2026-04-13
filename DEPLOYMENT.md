# Deployment

This repo now includes Docker deployment support for:

- `frontend` (Next.js)
- `backend` (Go + Gin)
- app `redis` for matchmaking/rate limiting
- external Judge0 via `JUDGE0_URL`

Important: the main app database is still external. Your backend expects PostgreSQL credentials in `backend/.env`. Judge0 is also expected to already exist outside this repo.

## 1. Prepare env files

Create the backend env file:

```bash
cp backend/.env.example backend/.env
```

Fill in your real values for:

- `JWT_SECRET`
- `PGHOST`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- Google OAuth values if you use Google login

Set `JUDGE0_URL` in `backend/.env` to your existing Judge0 instance, for example:

```bash
JUDGE0_URL=http://localhost:2358
```

## 2. Start everything

```bash
docker compose up --build -d
```

Then open:

- frontend: `http://localhost:3000`
- backend health check: `http://localhost:8080/health`
- Judge0 API: whatever URL you already run Judge0 on

## 3. Stop everything

```bash
docker compose down
```

## Notes

- The backend now reads `JUDGE0_URL` from env instead of hardcoding `localhost`.
- The backend now supports `AUTO_MIGRATE=true` so containers can boot without an interactive prompt.
- Google OAuth redirect now uses `APP_URL`, which defaults to `http://localhost:3000`.
- If your backend runs in Docker while Judge0 runs on the host, `host.docker.internal` is used by default in Compose.

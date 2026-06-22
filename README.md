# Lead Distribution Portal (Django + React)

This project provides:

- Public lead form
- Real-time internal dashboard (live feed + analytics)
- HubSpot router control and CRM contact sync

## Stack

- Backend: Django + SQLite + REST endpoints + SSE stream
- Frontend: React (Vite)

## 1) Backend setup

```bash
cd backend
cp .env.example .env
/usr/bin/python3 manage.py makemigrations
/usr/bin/python3 manage.py migrate
/usr/bin/python3 manage.py runserver
```

Set `HUBSPOT_ACCESS_TOKEN` inside `backend/.env` after recruiter grants sandbox access.

## 2) Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173` and backend at `http://localhost:8000`.

## Features implemented

- Lead capture fields:
  - First name
  - Last name
  - Corporate email
  - Company name
  - Estimated annual budget (`Under $10k`, `$10k-$50k`, `Greater than $50k`)
- Server-side ingestion and validation
- Local lead storage in SQLite
- HubSpot CRM sync via Contacts API
- Router control toggle to pause/resume HubSpot routing
- Live dashboard updates via Server-Sent Events
- Analytics badges:
  - Total leads ingested
  - Total estimated pipeline value

## API endpoints

- `GET /api/dashboard/`
- `GET /api/leads/`
- `POST /api/leads/create/`
- `POST /api/router/`
- `GET /api/leads/stream/`

## Notes

- Corporate email validation currently blocks common free email domains.
- If HubSpot token is missing, leads are still stored locally and dashboard updates in real time.

## Docker (both services)

Build and run both containers locally:

```bash
docker compose up --build
```

Endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Railway deployment (2 services)

Create two Railway services from the same repo.

This repo now includes per-service Railway config files:

- `backend/railway.json`
- `frontend/railway.json`

Railway will automatically read the config file from each service root directory.

### 1) Backend service

- In Railway: `New Service` -> `GitHub Repo`
- Service root directory: `backend`
- Config used: `backend/railway.json`
- Set environment variables:
  - `SECRET_KEY` = strong random string
  - `DEBUG` = `0`
  - `ALLOWED_HOSTS` = `<backend-service-domain>.up.railway.app`
  - `CORS_ALLOWED_ORIGINS` = `https://<frontend-service-domain>.up.railway.app`
  - `CSRF_TRUSTED_ORIGINS` = `https://<frontend-service-domain>.up.railway.app`
  - `HUBSPOT_ACCESS_TOKEN` = your HubSpot private app token
  - `DATABASE_URL` = Railway Postgres connection string (recommended)

Recommended: add a Railway Postgres plugin and use `${{Postgres.DATABASE_URL}}` as `DATABASE_URL`.

After first deploy, copy the backend public domain from Railway settings.

### 2) Frontend service

- In Railway: `New Service` -> `GitHub Repo`
- Service root directory: `frontend`
- Config used: `frontend/railway.json`
- Set variable:
  - `VITE_API_BASE_URL` = `https://<backend-service-domain>.up.railway.app/api`

Then redeploy backend with updated allowed origins:

- `ALLOWED_HOSTS` = `<backend-service-domain>.up.railway.app`
- `CORS_ALLOWED_ORIGINS` = `https://<frontend-service-domain>.up.railway.app`
- `CSRF_TRUSTED_ORIGINS` = `https://<frontend-service-domain>.up.railway.app`

After deploy, open frontend URL and verify lead submissions appear in the live feed.

## Quick deployment checklist

1. Push this repo to GitHub.
2. Create backend Railway service with root `backend`.
3. Attach Postgres and set backend environment variables.
4. Deploy backend and copy backend public URL.
5. Create frontend Railway service with root `frontend`.
6. Set `VITE_API_BASE_URL` to backend URL + `/api` and deploy frontend.
7. Update backend CORS/CSRF vars with frontend URL and redeploy backend.
8. Test form submit and dashboard live updates.

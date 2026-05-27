# Submission Guide

## What to submit

1. GitHub repository link
2. Deployed app link
3. Any credentials needed to log in
4. Share repository access with:
   - saurav@breatheesg.com
   - rahul@breatheesg.com
   - shivang@breatheesg.com

## Recommended submission email content

- Brief description of the app and what it does
- Link to GitHub repository
- Link to deployed app
- Notes on how to use the prototype
- Mention that the repository contains:
  - `backend/` Django REST API
  - `frontend/` React + Vite dashboard
  - `MODEL.md`, `DECISIONS.md`, `TRADEOFFS.md`, `SOURCES.md`

## Deployment notes

### Option 1: Render
- Create a new Web Service for the backend
- Use `py` / Python 3.14 runtime
- Set the start command to:
  - `gunicorn backend.wsgi:application`
- Add environment variable `DJANGO_SETTINGS_MODULE=backend.settings`
- If you want the frontend deployed separately, use a Static Site and run `npm run build`

### Option 2: Railway
- Create a Python service for the backend
- Create a static site service for the frontend
- Configure the frontend to proxy `/api` to the backend URL in production if needed

### Option 3: Local verification
- Backend: `py manage.py runserver`
- Frontend: `npm run dev`
- Open `http://localhost:4173`

## Important

- Make sure the repo is shared with the required Breathe ESG reviewer emails.
- If you deploy, share the live URL in your submission email.
- If there is no login feature, state that the app is open for review at the live URL.

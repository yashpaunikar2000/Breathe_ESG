# Breathe ESG Ingestion Prototype

This project is a Django REST backend and React frontend prototype for ingesting SAP fuel/procurement, utility electricity, and corporate travel data. It is designed for analyst review, normalization, and approval before audit.

## Structure

- `backend/`: Django REST API and ingestion model
- `frontend/`: React dashboard for uploads, review, and approvals
- `MODEL.md`, `DECISIONS.md`, `TRADEOFFS.md`, `SOURCES.md`: assignment deliverables

## Local setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend should be configured to proxy requests to the backend in development.

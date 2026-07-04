# StaffTrack — Full-Stack Project

## Structure
```
stafftrack_project/
├── frontend/
│   └── StaffTrack_v2_preview.jsx   # React frontend
├── backend/
│   ├── app.py                      # Flask API
│   └── requirements.txt
└── README.md
```

## Quick Start

### Backend (Python / Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
# API running at http://localhost:5000
```

### Frontend (React)
Drop `StaffTrack_v2_preview.jsx` into your Vite / CRA project, or
open it in the Claude Artifacts viewer.

## API Endpoints

| Method | Route                  | Description           |
|--------|------------------------|-----------------------|
| POST   | /api/login             | Authenticate user     |
| GET    | /api/staff             | List staff (filterable)|
| GET    | /api/staff/<id>        | Get one staff member  |
| POST   | /api/staff             | Create staff member   |
| PUT    | /api/staff/<id>        | Update staff member   |
| DELETE | /api/staff/<id>        | Delete staff member   |
| GET    | /api/stats             | Dept & status stats   |

## Query Parameters (GET /api/staff)
- `department` — filter by department (e.g. Engineering)
- `status`     — filter by status (Active | On Leave | Inactive)
- `q`          — full-text search on name / email / job title

## Default Credentials
| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | Admin |
| staff    | staff123  | Staff |

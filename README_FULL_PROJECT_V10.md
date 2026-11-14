# BoreTrack Full Project V10

This ZIP is a consolidated project based on the uploaded V9 project, with V10 Documents/Job Photos/GPS added.

## Included
- JWT login + owner/role permissions
- Dashboard
- Bookings + site inspections
- Pricing/rate cards
- Jobs + multiple points + casing + charges
- Machines + machine operations + fuel + breakdowns
- Workers + attendance + payroll + advances
- Payments + receivables
- Expenses + cash control
- Profitability reports
- Job files: documents, receipts, photos
- Explicit GPS capture per job
- Django admin + React/Vite frontend

## Run backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

## Run frontend in another terminal
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173/

Demo: `admin` / `admin123`

Uploaded media is stored under `backend/media/` during local development.

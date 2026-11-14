# BoreTrack — Combined Full Project

BoreTrack is a full-stack borewell drilling business management platform.

This package consolidates the functionality developed across the BoreTrack releases V1–V10 into one project, including authentication/roles, customers, agents, bookings, site inspection, jobs/points, pricing/rate cards, machine operations, fuel, breakdowns, workers/payroll, profitability, receivables, expenses/cash control, job documents/photos and GPS/location records.

## Project structure

```text
BoreTrack_FULL_PROJECT/
├── backend/
│   ├── manage.py
│   ├── config/
│   └── core/
└── frontend/
    ├── package.json
    └── src/
```

## Main modules

- User authentication and role/permission support
- Customers and agents
- Bookings and site inspections
- Drilling jobs and multiple points per job
- Passed/failed point tracking
- Casing lines and job charges
- Rate cards and rate lines
- Machines and machine operations
- Fuel/diesel logs
- Machine breakdowns and maintenance
- Workers, attendance, advances and wage settlements
- Payments and customer outstanding/receivables
- Job expenses and cash-control records
- Job profitability
- Job files/documents/photos
- GPS/job locations
- Django REST API
- React + Vite frontend
- Demo seed data

## Important business-rule notes

Some BoreTrack rules are intentionally kept configurable or require validation with the real business before production use. In particular:

- Rates can change over time; historical job rates should remain unchanged.
- Jali, drilling, normal casing and freshing were validated as per-foot charges.
- Bata is a worker charge; its exact charging basis still needs business validation.
- Casing price depends on company/type. Sudhakar is the preferred casing company when available.
- Customer-owned old casing is inserted without charging for the casing material; any separate service/insertion charge still needs validation.
- One customer/job can have multiple drilling points.
- Validated depth calculation currently uses 1 rod = 15 ft and a 5 ft inner/imer + bit component, but the exact fixed component should be confirmed before hard-coding it.
- The approximately 100 m nearby-borewell check should remain a validation item, not a hard-coded legal rule.
- Failed-bore pricing/discount rules require final business validation.

## Backend setup

Open PowerShell in:

```powershell
cd backend
```

Create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Apply migrations:

```powershell
python manage.py migrate
```

Load demo data:

```powershell
python manage.py seed_demo
```

Run backend:

```powershell
python manage.py runserver
```

## Frontend setup

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Then open the URL shown by Vite, normally:

```text
http://localhost:5173/
```

## Migration chain

The combined package uses a clean sequential migration history:

```text
0001_initial
  ↓
0002_booking_siteinspection
  ↓
0003_ratecard_rateline
  ↓
0004_fuellog_machineoperation_breakdown
  ↓
0005_wagesettlement
  ↓
0006_jobfile_joblocation
```

The duplicate `0002` migration packaging issue from earlier versions has been removed.

## Production note

This is a consolidated functional project/MVP foundation, not a claim that every workflow is production-ready. The next stage should be real-business validation of remaining unknowns, followed by final PRD/FRS, data-model review, security hardening, automated tests, audit requirements, offline behavior, GPS/privacy rules, deployment configuration and production database setup.

# BoreTrack V6 — Worker Wages & Advances

Adds wage settlements and a dedicated payroll workspace.

## Important business-validation choices
- Worker daily wage is already stored on Worker.
- Attendance remains the source record for presence/hours.
- Overtime amount is entered explicitly; no legal/business overtime formula is hard-coded.
- Bata remains a job charge and its unit/basis is not assumed.
- Advance deductions are recorded against wage settlements.
- Gross and net payable are calculated by the backend.

## Run
Backend: `python manage.py migrate` then `python manage.py runserver`
Frontend: `npm run dev`

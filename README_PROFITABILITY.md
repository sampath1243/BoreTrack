# BoreTrack V7 — Job Profitability & Financial Control

Adds `/api/reports/profitability/` and a Profitability page.

Per job:
- Cash revenue = recorded Payments
- Fuel cost = FuelLog litres × historical price/litre
- Worker cost = daily wage × present Attendance records
- Maintenance cost = job-linked Breakdown parts + labour cost
- Other cost = job-linked Expense records excluding fuel/wages/maintenance categories
- Estimated profit = revenue − all included costs
- Margin = estimated profit / revenue × 100

Important business-validation guardrails:
- Overtime is not included until the overtime rule is validated.
- Unallocated expenses are shown separately and excluded from job-level totals.
- The view is a management estimate based on recorded data, not a statutory accounting statement.

Run backend and frontend exactly as in the previous version. No new database migration is required for this V7 feature.

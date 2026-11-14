# BoreTrack V8 — Customer Receivables

Adds a Receivables workspace using existing Job and Payment records.

Features:
- job value, received and outstanding totals
- per-job customer balance
- payment entry with cash/UPI/bank/cheque/other
- avoids double-counting the Job.advance field when payment records exist
- does not change historical agreed totals

Run backend migrations if needed, then run frontend with npm run dev.

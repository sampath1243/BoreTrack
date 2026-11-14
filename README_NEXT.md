# BoreTrack Job Workspace v2

This build adds a real job workspace on top of the login/roles build.

## Added
- Click any job to open its workspace.
- Overview with agreed total, payments, outstanding and recorded depth.
- Multiple drilling points per job.
- Depth calculation: rods x 15 ft + inner/imer + bit.
- Point result: Pending / Passed / Failed.
- Casing lines with company, type, source, feet and historical rate.
- Customer-supplied casing can be recorded with zero business material value.
- Flexible job charges: drilling, Jali, Normal Casing, Freshing, Bata, Transport, Other.
- Default reference rates: Jali ₹550/ft, Drilling ₹70/ft, Normal Casing ₹350/ft, Freshing ₹45/ft, Bata ₹1,000 (unit remains configurable because its business basis is not yet validated), Transport ₹1,000/job.
- Job-linked customer payments.
- Backend filtering by job for points, casing, charges and payments.

## Important
These defaults are editable and are not treated as final business rules. Failed-bore pricing, Bata unit/basis, transport rules, customer-owned casing service charges and some field terminology still require business validation.

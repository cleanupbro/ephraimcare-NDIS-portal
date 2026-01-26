# Plan 11-05 Summary: Participant Appointments

## Status: COMPLETE

## What was built
- Appointments page in participant portal showing upcoming shifts
- Appointment card with worker info and cancellation request button
- Cancellation request dialog with reason field
- Admin cancellation requests review page
- Approve/reject workflow for cancellation requests

## Files created/modified
- `apps/participant/app/(protected)/appointments/page.tsx`
- `apps/participant/components/appointments/appointment-card.tsx`
- `apps/participant/components/appointments/cancellation-request-dialog.tsx`
- `apps/participant/hooks/use-appointments.ts`
- `apps/admin/app/(protected)/cancellation-requests/page.tsx`
- `apps/admin/hooks/use-cancellation-requests.ts`
- Sidebar updates for both portals

## Commits
- feat(11-05): participant appointments and cancellation requests

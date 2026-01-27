# Plan 10-01 Summary: Shift Form NDIS Validation

## Completed: 2026-01-26

### What Was Built

1. **Extended Worker interface** (`shift-form.tsx`)
   - Added `ndis_check_expiry: string | null` to Worker interface
   - Updated workers query to fetch `ndis_check_expiry` from database

2. **Added NDIS expiry validation** (`shift-form.tsx`)
   - Hard block for expired NDIS checks (cannot create shift)
   - Soft warning for expiring checks (within 90 days) - overridable via dialog
   - Added `formatExpiryDate()` helper for user-friendly date display

3. **Extended ConflictWarning type** (`shift-conflict-dialog.tsx`)
   - Added `'screening_expiring'` to conflict type union
   - Added "Compliance Warning" label with amber color

### Files Modified

| File | Changes |
|------|---------|
| `apps/admin/components/shifts/shift-form.tsx` | Worker interface, query, onSubmit validation |
| `apps/admin/components/shifts/shift-conflict-dialog.tsx` | ConflictWarning type, labels, colors |

### Verification

- TypeScript compiles without errors
- Expired NDIS check: Shows inline error "Worker's NDIS check has expired (DATE). Cannot assign to new shifts until renewed."
- Expiring NDIS check: Shows warning dialog with "Create Anyway" option

### Requirements Satisfied

- **SCRN-01**: System blocks assigning worker with expired NDIS check to new shifts (hard error)
- **SCRN-02**: System warns if worker NDIS check expires within 90 days (yellow warning, allows override)

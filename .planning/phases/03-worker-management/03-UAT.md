---
status: diagnosed
phase: 03-worker-management
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md]
started: 2026-01-24T12:00:00Z
updated: 2026-01-24T17:56:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Worker List Page Loads
expected: Navigate to /workers. You should see a "Workers" heading and a DataTable with columns: Name, Email, Support Types, Status (colored dot), Hours This Week, and Actions.
result: pass

### 2. Worker Search by Name or Email
expected: Type a worker's name or email in the search bar on /workers. The table should filter to show only matching workers in real-time (client-side filtering).
result: pass

### 3. Worker Status Filter
expected: Use the status dropdown on /workers to switch between Active, Inactive, and All. The table should update to show only workers matching the selected status.
result: pass

### 4. Compliance Traffic Light Dot
expected: On the worker list, each worker row shows a colored dot in the Status column: green (valid), amber (expiring within 90 days), red (expired), or gray (not set) based on their NDIS/WWCC check dates.
result: issue
reported: "status dots all show gray because compliance columns not found in database schema cache - migration not applied"
severity: major

### 5. Add Worker Navigation
expected: Click the "Add Worker" button on the /workers page. You should be navigated to /workers/new with a form containing 3 sections: Basic Info, Support Types, and Compliance.
result: pass

### 6. Worker Creation Form Validation
expected: On /workers/new, submit the form without filling required fields. Validation errors should appear for each missing required field.
result: pass

### 7. Create Worker Successfully
expected: Fill in all required fields on /workers/new and submit. You should be redirected back to /workers and see the new worker in the list.
result: issue
reported: "Failed to create worker - Email address is invalid. Tried test@gmail.com and testworker@ephraimcare.com.au, both rejected by Supabase auth"
severity: major

### 8. Worker Detail Page
expected: Click a worker's name in the list. You should see a detail page with full name, badge, buttons, stat cards, profile card, support types, qualifications, and compliance section.
result: pass

### 9. Compliance Badges on Detail
expected: On a worker's detail page, the Compliance section shows NDIS Worker Check and WWCC with check numbers, expiry dates, and status badges.
result: pass

### 10. Worker Edit Form
expected: Click Edit on a worker's detail page. The edit form should open with all fields pre-filled except email (locked with Lock icon).
result: pass

### 11. Save Worker Edit
expected: Change a field on the edit form and click Save Changes. You should be redirected back to the detail page with the updated information.
result: issue
reported: "Failed to update worker: Could not find the 'ndis_check_expiry' column of 'workers' in the schema cache"
severity: blocker

### 12. Resend Invite Button
expected: On an active worker's detail page, click Resend Invite. Should show loading spinner then success toast.
result: issue
reported: "Failed to resend invite - A user with this email address has already been registered"
severity: major

## Summary

total: 12
passed: 8
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Compliance dots show correct colors based on NDIS/WWCC expiry dates"
  status: failed
  reason: "User reported: status dots all show gray because compliance columns not found in database schema cache - migration not applied"
  severity: major
  test: 4
  root_cause: "Migration 20260124100001_add_worker_compliance_columns.sql was never applied to remote Supabase DB. Columns don't exist in actual database."
  artifacts:
    - path: "supabase/migrations/20260124100001_add_worker_compliance_columns.sql"
      issue: "Valid SQL but never applied to remote instance"
    - path: "packages/types/src/database.ts"
      issue: "Missing compliance columns in workers type definition"
  missing:
    - "Apply migration to remote DB via Supabase Dashboard SQL Editor or supabase db push"
    - "Regenerate TypeScript types with supabase gen types typescript"
  debug_session: ".planning/debug/worker-compliance-schema-cache.md"

- truth: "Admin can create a new worker with valid email and see them in the list"
  status: failed
  reason: "User reported: Failed to create worker - Email address is invalid. Tried test@gmail.com and testworker@ephraimcare.com.au, both rejected by Supabase auth"
  severity: major
  test: 7
  root_cause: "Supabase hosted instance has no custom SMTP configured. Built-in email restricts sending to organization members only, returning misleading 'invalid' error for external emails."
  artifacts:
    - path: "apps/admin/app/api/workers/invite/route.ts"
      issue: "Code is correct but SMTP not configured on Supabase project"
    - path: ".env.local"
      issue: "Missing NEXT_PUBLIC_SITE_URL for redirect"
  missing:
    - "Configure custom SMTP in Supabase Dashboard (Authentication > SMTP Settings) using Resend"
    - "Add NEXT_PUBLIC_SITE_URL=http://localhost:3000 to .env.local"
  debug_session: ".planning/debug/worker-invite-email-invalid.md"

- truth: "Admin can save edits to worker profile fields"
  status: failed
  reason: "User reported: Failed to update worker: Could not find the 'ndis_check_expiry' column of 'workers' in the schema cache"
  severity: blocker
  test: 11
  root_cause: "Same as Test 4: compliance migration never applied. useUpdateWorker sends compliance fields via (as any) bypass, PostgREST rejects unknown columns."
  artifacts:
    - path: "apps/admin/hooks/use-workers.ts"
      issue: "useUpdateWorker sends compliance fields that don't exist in DB, masked by (as any) cast"
    - path: "supabase/migrations/20260124100001_add_worker_compliance_columns.sql"
      issue: "Never applied to remote DB"
  missing:
    - "Apply migration to remote DB (same fix as Test 4)"
    - "Alternatively: skip compliance fields in update if columns don't exist yet"
  debug_session: ".planning/debug/worker-compliance-schema-cache.md"

- truth: "Resend invite sends new invitation email to worker"
  status: failed
  reason: "User reported: Failed to resend invite - A user with this email address has already been registered"
  severity: major
  test: 12
  root_cause: "generateLink uses type:'invite' which only works for NEW users. Seed workers already exist in auth. Should use type:'magiclink' for existing users."
  artifacts:
    - path: "apps/admin/app/api/workers/resend-invite/route.ts"
      issue: "Uses type:'invite' instead of checking if user exists first and using 'magiclink'"
  missing:
    - "Check if user exists with getUserByEmail, use 'magiclink' type for existing users, 'invite' for new"
  debug_session: ".planning/debug/worker-invite-email-invalid.md"

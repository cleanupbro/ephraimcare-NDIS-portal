---
status: resolved
trigger: "worker compliance columns not found in Supabase schema cache"
created: 2026-01-24T10:00:00Z
updated: 2026-01-24T10:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - Migration exists but was never applied to remote DB, and TypeScript Database type was never regenerated
test: Checked database.ts types, .env connection, and Docker state
expecting: Workers type in database.ts missing compliance columns
next_action: Report root cause

## Symptoms

expected: useUpdateWorker hook should successfully update ndis_check_number, ndis_check_expiry, wwcc_number, wwcc_expiry on workers table
actual: Error "Could not find the 'ndis_check_expiry' column of 'workers' in the schema cache"
errors: Schema cache miss for compliance columns
reproduction: Attempt to update a worker with compliance fields filled in
started: After adding compliance columns migration

## Eliminated

(none - first hypothesis confirmed)

## Evidence

- timestamp: 2026-01-24T10:05:00Z
  checked: supabase/migrations/20260124100001_add_worker_compliance_columns.sql
  found: Valid SQL - ALTER TABLE workers ADD COLUMN for all 4 compliance fields
  implication: Migration file itself is correct

- timestamp: 2026-01-24T10:06:00Z
  checked: .env.local for Supabase connection
  found: Remote Supabase project (vkjxqvfzhiglpqvlehsk.supabase.co), no local setup
  implication: This is a hosted/remote database - migrations must be pushed via CLI or dashboard

- timestamp: 2026-01-24T10:07:00Z
  checked: Docker containers for local Supabase
  found: No local Supabase containers running, no .supabase link directory
  implication: supabase db push or supabase migration up was never run against remote

- timestamp: 2026-01-24T10:08:00Z
  checked: packages/types/src/database.ts - workers table type definition
  found: Workers Row/Insert/Update types do NOT include ndis_check_number, ndis_check_expiry, wwcc_number, or wwcc_expiry
  implication: TypeScript types were never regenerated after writing the migration

- timestamp: 2026-01-24T10:09:00Z
  checked: apps/admin/hooks/use-workers.ts - useUpdateWorker mutation
  found: workerFields object sends ndis_check_number, ndis_check_expiry, wwcc_number, wwcc_expiry to supabase .update()
  implication: Hook sends columns that don't exist in DB or type system

- timestamp: 2026-01-24T10:10:00Z
  checked: apps/admin/hooks/use-workers.ts line 91-92
  found: Uses `(supabase.from('workers') as any)` cast to bypass TypeScript type checking
  implication: The `as any` cast hides the type mismatch at compile time, but Supabase PostgREST still fails at runtime

- timestamp: 2026-01-24T10:11:00Z
  checked: packages/supabase/src/client.ts
  found: Client is typed with Database generic - createBrowserClient<Database>(...)
  implication: PostgREST schema cache on remote server reflects actual DB columns, not local types

## Resolution

root_cause: |
  TWO-LAYER FAILURE:

  1. MIGRATION NEVER APPLIED: The migration file (20260124100001_add_worker_compliance_columns.sql)
     exists locally but was never executed against the remote Supabase database
     (vkjxqvfzhiglpqvlehsk.supabase.co). There is no local Supabase instance (no Docker
     containers, no .supabase link directory). The columns ndis_check_number, ndis_check_expiry,
     wwcc_number, and wwcc_expiry do NOT exist on the actual workers table.

  2. TYPE DEFINITIONS NOT REGENERATED: packages/types/src/database.ts still shows the original
     workers table schema (only id, profile_id, employee_id, qualification, services_provided,
     hourly_rate, max_hours_per_week, organization_id, is_active, created_at, updated_at).
     The compliance columns are absent from the TypeScript types.

  The `as any` cast on line 91 of use-workers.ts masks the TypeScript error, allowing the code
  to compile. But at runtime, Supabase PostgREST checks its own schema cache (which reflects the
  ACTUAL database schema on the remote server) and correctly reports the columns don't exist.

  The error "Could not find the 'ndis_check_expiry' column of 'workers' in the schema cache"
  is PostgREST saying: "I looked at the real database schema and this column does not exist."

fix: |
  1. Apply the migration to the remote database:
     - Option A: supabase link --project-ref vkjxqvfzhiglpqvlehsk && supabase db push
     - Option B: Run the ALTER TABLE statements directly in Supabase Dashboard SQL Editor

  2. After columns exist in DB, regenerate TypeScript types:
     supabase gen types typescript --project-id vkjxqvfzhiglpqvlehsk > packages/types/src/database.ts

  3. Remove the `as any` cast from use-workers.ts (lines 83-84, 91-92) so TypeScript
     properly validates column names going forward.

verification: Pending - requires applying migration to remote DB
files_changed: []

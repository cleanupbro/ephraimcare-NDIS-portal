#!/usr/bin/env npx tsx
/**
 * Fix Shifts Schema - One-time migration script
 *
 * This script adds the missing support_type column to the shifts table.
 * Run this once to fix the "support_type column not found" error.
 *
 * Usage: npx tsx scripts/fix-shifts-schema.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkjxqvfzhiglpqvlehsk.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.log('\nRun with: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/fix-shifts-schema.ts')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'public' }
})

async function runMigration() {
  console.log('🔧 Running shifts schema fix...\n')

  // Check if column already exists by trying to select it
  const { data: testData, error: testError } = await supabase
    .from('shifts')
    .select('support_type')
    .limit(1)

  if (!testError) {
    console.log('✅ support_type column already exists! No fix needed.')
    return
  }

  if (!testError.message.includes('support_type')) {
    console.error('❌ Unexpected error:', testError.message)
    return
  }

  console.log('📋 Column missing. Running SQL migration...\n')

  // The migration SQL
  const migrationSQL = `
    -- Add new enum values for shift status
    DO $$ BEGIN
      ALTER TYPE public.shift_status ADD VALUE IF NOT EXISTS 'pending';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TYPE public.shift_status ADD VALUE IF NOT EXISTS 'proposed';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- Add support_type column
    ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS support_type text;

    -- Change default status
    ALTER TABLE public.shifts ALTER COLUMN status SET DEFAULT 'pending';

    -- Create composite index for overlap detection
    CREATE INDEX IF NOT EXISTS idx_shifts_worker_timerange
    ON public.shifts(worker_id, scheduled_start, scheduled_end)
    WHERE status NOT IN ('cancelled');
  `

  // Note: This requires using the database directly or SQL Editor
  // The REST API doesn't support DDL statements
  console.log('⚠️  The Supabase REST API does not support DDL (ALTER TABLE) statements.')
  console.log('\n📝 Please run this SQL in Supabase SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/vkjxqvfzhiglpqvlehsk/sql\n')
  console.log('─'.repeat(60))
  console.log(`
ALTER TYPE public.shift_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.shift_status ADD VALUE IF NOT EXISTS 'proposed';
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS support_type text;
ALTER TABLE public.shifts ALTER COLUMN status SET DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS idx_shifts_worker_timerange
ON public.shifts(worker_id, scheduled_start, scheduled_end)
WHERE status NOT IN ('cancelled');
  `.trim())
  console.log('─'.repeat(60))
  console.log('\n✅ After running the SQL, shift creation will work correctly.')
}

runMigration().catch(console.error)

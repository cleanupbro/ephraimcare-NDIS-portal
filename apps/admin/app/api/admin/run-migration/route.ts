import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * TEMPORARY MIGRATION ENDPOINT
 * This runs the missing shift schema migration.
 * DELETE THIS FILE AFTER RUNNING ONCE.
 */

const MIGRATION_SECRET = 'run-shift-migration-2026'

export async function POST(request: Request) {
  try {
    // Simple secret check
    const { secret } = await request.json()
    if (secret !== MIGRATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Test if column already exists
    const { error: testError } = await supabase
      .from('shifts')
      .select('support_type')
      .limit(1)

    if (!testError) {
      return NextResponse.json({
        success: true,
        message: 'support_type column already exists! No migration needed.'
      })
    }

    // Column doesn't exist - need to run migration via SQL
    // Since we can't run DDL via REST API, we'll use a database function

    // First, try to create the exec_sql function if it doesn't exist
    // This is a workaround - we create a function that can execute SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.exec_migration_sql(sql_text text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
      END;
      $$;
    `

    // Try calling the function to add the column
    const { error: rpcError } = await supabase.rpc('exec_migration_sql', {
      sql_text: 'ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS support_type text;'
    })

    if (rpcError) {
      // Function doesn't exist, need to create it first via SQL Editor
      return NextResponse.json({
        success: false,
        message: 'Cannot run DDL via REST API. Please run SQL manually in Supabase Dashboard.',
        sql: `
ALTER TYPE public.shift_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.shift_status ADD VALUE IF NOT EXISTS 'proposed';
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS support_type text;
ALTER TABLE public.shifts ALTER COLUMN status SET DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS idx_shifts_worker_timerange
ON public.shifts(worker_id, scheduled_start, scheduled_end)
WHERE status NOT IN ('cancelled');
        `.trim(),
        dashboard_url: `https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql/new`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully!'
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST with { "secret": "run-shift-migration-2026" } to run migration'
  })
}

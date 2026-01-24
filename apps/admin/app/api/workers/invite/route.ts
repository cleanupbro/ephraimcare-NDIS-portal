import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@ephraimcare/supabase'

export async function POST(request: Request) {
  try {
    // 1. Verify caller is admin/coordinator
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    const profile = callerProfile as { role: string; organization_id: string } | null

    if (!profile || !['admin', 'coordinator'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const organizationId = profile.organization_id

    // 2. Parse and validate request body
    const body = await request.json()
    const {
      email,
      first_name,
      last_name,
      phone,
      services_provided,
      qualification,
      hourly_rate,
      max_hours_per_week,
      ndis_check_number,
      ndis_check_expiry,
      wwcc_number,
      wwcc_expiry,
    } = body

    // Basic validation
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      )
    }

    if (!services_provided || !Array.isArray(services_provided) || services_provided.length === 0) {
      return NextResponse.json(
        { error: 'At least one support type is required' },
        { status: 400 }
      )
    }

    // 3. Create auth user directly (bypasses Supabase SMTP)
    const admin = createAdminClient()

    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role: 'worker',
      },
    })

    if (createError || !authData.user) {
      return NextResponse.json(
        { error: createError?.message ?? 'Failed to create user' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Generate a magic link for the worker to set up their account
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000'
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })

    // Send welcome email via Resend API
    if (process.env.RESEND_API_KEY && linkData?.properties?.action_link) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Ephraim Care <onboarding@resend.dev>',
            to: [email],
            subject: 'Welcome to Ephraim Care - Set Up Your Account',
            html: `
              <h2>Welcome to Ephraim Care, ${first_name}!</h2>
              <p>You've been invited as a support worker. Click the link below to access your account:</p>
              <p><a href="${linkData.properties.action_link}" style="background-color:#66BB6A;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Access My Account</a></p>
              <p>If the button doesn't work, copy this link: ${linkData.properties.action_link}</p>
              <br/>
              <p style="color:#666;font-size:12px;">Powered by OpBros</p>
            `,
          }),
        })
      } catch (emailErr) {
        // Email send failed but user was created - log but don't block
        console.error('Welcome email failed:', emailErr)
      }
    }

    // 4. Create profile record
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: userId,
        role: 'worker',
        first_name,
        last_name,
        email,
        phone: phone || null,
        organization_id: organizationId,
      } as any)

    if (profileError) {
      // Cleanup: delete auth user
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // 5. Create worker record
    // Convert empty string dates to null
    const ndisExpiry = ndis_check_expiry || null
    const wwccExpiry = wwcc_expiry || null

    const { data: worker, error: workerError } = await admin
      .from('workers')
      .insert({
        profile_id: userId,
        organization_id: organizationId,
        services_provided: services_provided,
        qualification: qualification || [],
        hourly_rate: hourly_rate || null,
        max_hours_per_week: max_hours_per_week ?? 38,
        ndis_check_number: ndis_check_number || null,
        ndis_check_expiry: ndisExpiry,
        wwcc_number: wwcc_number || null,
        wwcc_expiry: wwccExpiry,
      } as any)
      .select('id')
      .single()

    if (workerError) {
      // Cleanup: delete profile and auth user
      await admin.from('profiles').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Failed to create worker: ${workerError.message}` },
        { status: 500 }
      )
    }

    // 6. Return success
    return NextResponse.json(
      { id: (worker as any).id, user_id: userId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Worker invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

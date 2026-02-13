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
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = callerProfile as { role: string } | null

    if (!profile || !['admin', 'coordinator'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // 3. Generate magic link using admin client
    const admin = createAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_ADMIN_URL

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message },
        { status: 500 }
      )
    }

    // 4. Send the magic link via Resend API
    if (process.env.RESEND_API_KEY && linkData?.properties?.action_link) {
      // Look up worker name for a personalized email
      const { data: workerProfile } = await admin
        .from('profiles')
        .select('first_name')
        .eq('email', email)
        .single()

      const firstName = (workerProfile as any)?.first_name || 'there'

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Ephraim Care <noreply@ephraimcare.com.au>',
            to: [email],
            subject: 'Ephraim Care - Your Login Link',
            html: `
              <h2>Hi ${firstName}!</h2>
              <p>Here's your login link for Ephraim Care:</p>
              <p><a href="${linkData.properties.action_link}" style="background-color:#66BB6A;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Access My Account</a></p>
              <p>If the button doesn't work, copy this link: ${linkData.properties.action_link}</p>
              <br/>
              <p style="color:#666;font-size:12px;">Powered by OpBros</p>
            `,
          }),
        })
      } catch (emailErr) {
        console.error('Resend invite email failed:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

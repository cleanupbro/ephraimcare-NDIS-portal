import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms, formatToE164, isValidPhoneNumber } from '@/lib/sms/send-sms'
import { testSms } from '@/lib/sms/templates'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and org
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single() as { data: { organization_id: string | null; role: string } | null }

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single() as { data: { name: string } | null }

    // Parse request
    const { testPhone } = await request.json()

    if (!testPhone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    const formattedPhone = formatToE164(testPhone)

    if (!isValidPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use Australian format: 0412345678 or +61412345678' },
        { status: 400 }
      )
    }

    // Send test SMS
    const result = await sendSms({
      to: formattedPhone,
      body: testSms(org?.name || 'Ephraim Care'),
      organizationId: profile.organization_id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test SMS sent to ${formattedPhone}`,
      sid: result.sid,
    })
  } catch (error) {
    console.error('Test SMS error:', error)
    return NextResponse.json(
      { error: 'Failed to send test SMS' },
      { status: 500 }
    )
  }
}

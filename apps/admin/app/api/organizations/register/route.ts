import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { organizationRegisterSchema } from '@/lib/supabase/schemas'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = organizationRegisterSchema.parse(body)

    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check for duplicate ABN
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('abn', validatedData.abn)
      .single()

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this ABN already exists' },
        { status: 400 }
      )
    }

    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: validatedData.organizationName,
        abn: validatedData.abn,
        status: 'active',
        settings: {
          sms_enabled: false,
          xero_connected: false,
          ndia_registered: false,
        },
      } as any)
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation failed:', orgError)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    // 2. Create admin user via auth API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.adminEmail,
      password: validatedData.adminPassword,
      email_confirm: true,
    })

    if (authError) {
      // Rollback: delete organization
      await supabase.from('organizations').delete().eq('id', org.id)
      console.error('Admin user creation failed:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create admin user' },
        { status: 400 }
      )
    }

    // 3. Create profile for admin
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: validatedData.adminEmail,
      first_name: validatedData.adminFirstName,
      last_name: validatedData.adminLastName,
      role: 'admin',
      organization_id: org.id,
      is_platform_admin: false,
    } as any)

    if (profileError) {
      // Rollback: delete user and organization
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase.from('organizations').delete().eq('id', org.id)
      console.error('Profile creation failed:', profileError)
      return NextResponse.json(
        { error: 'Failed to create admin profile' },
        { status: 500 }
      )
    }

    // 4. Create user_roles entry
    await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'admin',
      organization_id: org.id,
    } as any)

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      message: 'Organization registered successfully. You can now log in.',
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}

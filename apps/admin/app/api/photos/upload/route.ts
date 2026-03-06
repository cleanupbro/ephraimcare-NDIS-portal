import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Upload shift photo to Supabase Storage
 * POST /api/photos/upload
 */
export async function POST(request: Request) {
  try {
    // Authenticate caller
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify role (admin, coordinator, or worker)
    const { data: profile } = await (supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single() as any)

    if (!profile || !['admin', 'coordinator', 'worker'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      photoId,
      shiftId,
      base64,
      timestamp,
      caption,
      latitude,
      longitude,
      fileSize,
    } = body

    if (!photoId || !shiftId || !base64) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use untyped service client for shift_photos (not in generated types)
    const adminSupabase = createServiceClient()

    // Verify shift belongs to caller's organization
    const { data: shift, error: shiftError } = await adminSupabase
      .from('shifts')
      .select('id, organization_id, worker_id')
      .eq('id', shiftId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (shiftError || !shift) {
      return NextResponse.json(
        { error: 'Shift not found or access denied' },
        { status: 404 }
      )
    }

    // Workers can only upload photos for their own shifts
    if (profile.role === 'worker' && shift.worker_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only upload photos for your own shifts' },
        { status: 403 }
      )
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64')

    // Generate storage path: org_id/shift_id/photo_id.jpg
    const storagePath = `${profile.organization_id}/${shiftId}/${photoId}.jpg`

    // Upload to Supabase Storage
    const { error: uploadError } = await adminSupabase.storage
      .from('shift-photos')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = adminSupabase.storage
      .from('shift-photos')
      .getPublicUrl(storagePath)

    // Insert record in shift_photos table
    const { error: insertError } = await adminSupabase.from('shift_photos').insert({
      id: photoId,
      shift_id: shiftId,
      worker_id: profile.role === 'worker' ? user.id : (body.workerId || null),
      organization_id: profile.organization_id,
      storage_path: storagePath,
      storage_url: urlData.publicUrl,
      caption: caption || null,
      taken_at: timestamp,
      file_size_bytes: fileSize || buffer.length,
      latitude: latitude || null,
      longitude: longitude || null,
    })

    if (insertError) {
      // Cleanup uploaded file
      await adminSupabase.storage.from('shift-photos').remove([storagePath])

      console.error('Database insert failed:', insertError)
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photoId,
      storageUrl: urlData.publicUrl,
    })
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Photo upload failed' },
      { status: 500 }
    )
  }
}

/**
 * Delete a shift photo
 * DELETE /api/photos/upload?photoId=xxx
 */
export async function DELETE(request: Request) {
  try {
    // Authenticate caller
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify role
    const { data: profile } = await (supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single() as any)

    if (!profile || !['admin', 'coordinator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only admins can delete photos' }, { status: 403 })
    }

    const url = new URL(request.url)
    const photoId = url.searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID required' },
        { status: 400 }
      )
    }

    const adminSupabase = createServiceClient()

    // Get photo record and verify it belongs to caller's org
    const { data: photo, error: fetchError } = await adminSupabase
      .from('shift_photos')
      .select('storage_path, organization_id')
      .eq('id', photoId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete from storage
    await adminSupabase.storage.from('shift-photos').remove([photo.storage_path])

    // Delete record
    await adminSupabase.from('shift_photos').delete().eq('id', photoId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Photo delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Upload shift photo to Supabase Storage
 * POST /api/photos/upload
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      photoId,
      shiftId,
      workerId,
      organizationId,
      base64,
      timestamp,
      caption,
      latitude,
      longitude,
      fileSize,
    } = body

    if (!photoId || !shiftId || !workerId || !organizationId || !base64) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create service client for storage operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify shift belongs to organization
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, organization_id')
      .eq('id', shiftId)
      .eq('organization_id', organizationId)
      .single()

    if (shiftError || !shift) {
      return NextResponse.json(
        { error: 'Shift not found or access denied' },
        { status: 404 }
      )
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64')

    // Generate storage path: org_id/shift_id/photo_id.jpg
    const storagePath = `${organizationId}/${shiftId}/${photoId}.jpg`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
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
    const { data: urlData } = supabase.storage
      .from('shift-photos')
      .getPublicUrl(storagePath)

    // Insert record in shift_photos table
    const { error: insertError } = await supabase.from('shift_photos').insert({
      id: photoId,
      shift_id: shiftId,
      worker_id: workerId,
      organization_id: organizationId,
      storage_path: storagePath,
      storage_url: urlData.publicUrl,
      caption: caption || null,
      taken_at: timestamp,
      file_size_bytes: fileSize || buffer.length,
      latitude: latitude || null,
      longitude: longitude || null,
    } as any)

    if (insertError) {
      // Cleanup uploaded file
      await supabase.storage.from('shift-photos').remove([storagePath])

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
    const url = new URL(request.url)
    const photoId = url.searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get photo record
    const { data: photo, error: fetchError } = await supabase
      .from('shift_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete from storage
    await supabase.storage.from('shift-photos').remove([photo.storage_path])

    // Delete record
    await supabase.from('shift_photos').delete().eq('id', photoId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Photo delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}

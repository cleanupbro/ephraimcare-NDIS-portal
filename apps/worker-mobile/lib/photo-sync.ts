import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { useSyncStore } from '../stores/syncStore'

const PHOTO_DIR = FileSystem.documentDirectory + 'shift_photos/'
const MAX_PHOTOS_PER_SHIFT = 3

export interface CapturedPhoto {
  id: string
  localUri: string
  shiftId: string
  timestamp: string
  uploaded: boolean
  caption?: string
  latitude?: number
  longitude?: number
}

/**
 * Ensure photo directory exists
 */
export async function ensurePhotoDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true })
  }
}

/**
 * Get photos captured for a shift
 */
export async function getShiftPhotos(shiftId: string): Promise<CapturedPhoto[]> {
  await ensurePhotoDir()

  const files = await FileSystem.readDirectoryAsync(PHOTO_DIR)
  const shiftFiles = files.filter((f) => f.startsWith(shiftId))

  return shiftFiles.map((filename) => {
    const [, timestamp] = filename.replace('.jpg', '').split('_')
    return {
      id: filename.replace('.jpg', ''),
      localUri: PHOTO_DIR + filename,
      shiftId,
      timestamp: new Date(parseInt(timestamp)).toISOString(),
      uploaded: false,
    }
  })
}

/**
 * Count photos for a shift
 */
export async function countShiftPhotos(shiftId: string): Promise<number> {
  const photos = await getShiftPhotos(shiftId)
  return photos.length
}

/**
 * Capture a new photo for a shift
 * Returns null if cancelled or max photos reached
 */
export async function captureShiftPhoto(
  shiftId: string,
  location?: { latitude: number; longitude: number }
): Promise<CapturedPhoto | null> {
  // Check photo limit
  const count = await countShiftPhotos(shiftId)
  if (count >= MAX_PHOTOS_PER_SHIFT) {
    throw new Error(`Maximum ${MAX_PHOTOS_PER_SHIFT} photos per shift`)
  }

  // Request camera permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Camera permission required')
  }

  // Launch camera
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7, // Compress for storage
    allowsEditing: false,
    base64: false,
    exif: true,
  })

  if (result.canceled) {
    return null
  }

  await ensurePhotoDir()

  const asset = result.assets[0]
  const timestamp = Date.now()
  const photoId = `${shiftId}_${timestamp}`
  const localUri = `${PHOTO_DIR}${photoId}.jpg`

  // Move to permanent location
  await FileSystem.moveAsync({
    from: asset.uri,
    to: localUri,
  })

  const photo: CapturedPhoto = {
    id: photoId,
    localUri,
    shiftId,
    timestamp: new Date(timestamp).toISOString(),
    uploaded: false,
    latitude: location?.latitude,
    longitude: location?.longitude,
  }

  // Queue for sync
  useSyncStore.getState().addPendingAction({
    type: 'photo_upload',
    shiftId,
    timestamp: photo.timestamp,
    latitude: location?.latitude || 0,
    longitude: location?.longitude || 0,
    payload: {
      photoId,
      localUri,
    },
  })

  return photo
}

/**
 * Upload a single photo to server
 */
export async function uploadPhoto(
  photo: CapturedPhoto,
  organizationId: string,
  workerId: string,
  apiUrl: string
): Promise<{ success: boolean; storageUrl?: string; error?: string }> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(photo.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Get file info for size
    const fileInfo = await FileSystem.getInfoAsync(photo.localUri)

    // Upload to API
    const response = await fetch(`${apiUrl}/api/photos/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoId: photo.id,
        shiftId: photo.shiftId,
        workerId,
        organizationId,
        base64,
        timestamp: photo.timestamp,
        caption: photo.caption,
        latitude: photo.latitude,
        longitude: photo.longitude,
        fileSize: fileInfo.exists ? (fileInfo as any).size : 0,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Upload failed')
    }

    const { storageUrl } = await response.json()

    // Delete local file after successful upload
    await FileSystem.deleteAsync(photo.localUri, { idempotent: true })

    return { success: true, storageUrl }
  } catch (error) {
    console.error('Photo upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Sync all pending photos for a shift
 */
export async function syncShiftPhotos(
  shiftId: string,
  organizationId: string,
  workerId: string,
  apiUrl: string
): Promise<{ synced: number; failed: number }> {
  const photos = await getShiftPhotos(shiftId)
  let synced = 0
  let failed = 0

  for (const photo of photos) {
    const result = await uploadPhoto(photo, organizationId, workerId, apiUrl)
    if (result.success) {
      synced++
    } else {
      failed++
    }
  }

  return { synced, failed }
}

/**
 * Sync all pending photos across all shifts
 */
export async function syncPendingPhotos(
  organizationId: string,
  workerId: string,
  apiUrl: string
): Promise<{ synced: number; failed: number }> {
  await ensurePhotoDir()

  const files = await FileSystem.readDirectoryAsync(PHOTO_DIR)
  let synced = 0
  let failed = 0

  for (const filename of files) {
    const [shiftId, timestamp] = filename.replace('.jpg', '').split('_')
    const photo: CapturedPhoto = {
      id: filename.replace('.jpg', ''),
      localUri: PHOTO_DIR + filename,
      shiftId,
      timestamp: new Date(parseInt(timestamp)).toISOString(),
      uploaded: false,
    }

    const result = await uploadPhoto(photo, organizationId, workerId, apiUrl)
    if (result.success) {
      synced++
    } else {
      failed++
    }
  }

  return { synced, failed }
}

/**
 * Delete a local photo
 */
export async function deleteLocalPhoto(photoId: string): Promise<void> {
  const localUri = `${PHOTO_DIR}${photoId}.jpg`
  await FileSystem.deleteAsync(localUri, { idempotent: true })
}

/**
 * Get total size of pending photos
 */
export async function getPendingPhotoSize(): Promise<number> {
  await ensurePhotoDir()

  const files = await FileSystem.readDirectoryAsync(PHOTO_DIR)
  let totalSize = 0

  for (const file of files) {
    const info = await FileSystem.getInfoAsync(PHOTO_DIR + file)
    if (info.exists && 'size' in info) {
      totalSize += (info as any).size
    }
  }

  return totalSize
}

/**
 * Clear all pending photos (for logout)
 */
export async function clearAllPendingPhotos(): Promise<void> {
  await ensurePhotoDir()

  const files = await FileSystem.readDirectoryAsync(PHOTO_DIR)
  for (const file of files) {
    await FileSystem.deleteAsync(PHOTO_DIR + file, { idempotent: true })
  }
}

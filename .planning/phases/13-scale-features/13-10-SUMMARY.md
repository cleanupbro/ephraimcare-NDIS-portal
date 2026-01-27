# Plan 13-10 Summary: Offline Photo Capture

## Status: Complete

## What Was Built

### Photo Capture & Sync System
- **shift_photos migration** - Database schema with RLS policies
- **photo-sync.ts** - Capture, local storage, and upload functions
- **ShiftPhotoCapture.tsx** - Camera UI with thumbnails and sync badges
- **syncStore update** - Added photo_upload action type
- **Upload API** - Server endpoint for receiving and storing photos

### Key Features
1. 3 photos per shift limit (per CONTEXT.md decision)
2. Photos stored locally in expo-file-system until online
3. 0.7 quality compression on capture (storage optimization)
4. Location metadata attached to photos for verification
5. Pending upload badge on unsynced photos
6. Auto-delete local files after successful upload
7. RLS restricts viewing to organization members

## Files Created/Modified

| File | Action | Lines |
|------|--------|-------|
| supabase/migrations/20260127000006_shift_photos.sql | Created | 48 |
| apps/worker-mobile/lib/photo-sync.ts | Created | 228 |
| apps/worker-mobile/components/ShiftPhotoCapture.tsx | Created | 181 |
| apps/worker-mobile/stores/syncStore.ts | Modified | +9 |
| apps/admin/app/api/photos/upload/route.ts | Created | 143 |

## Database Schema

```sql
shift_photos (
  id uuid PRIMARY KEY,
  shift_id uuid REFERENCES shifts,
  worker_id uuid REFERENCES workers,
  organization_id uuid REFERENCES organizations,
  storage_path text,
  storage_url text,
  caption text,
  taken_at timestamptz,
  file_size_bytes integer,
  latitude/longitude numeric
)
```

## Verification

- [x] captureShiftPhoto() stores to local filesystem
- [x] getShiftPhotos() lists local photos for shift
- [x] syncPendingPhotos() uploads all pending
- [x] Max 3 photos enforced per shift
- [x] Upload API validates shift ownership
- [x] Photos stored in Supabase Storage bucket
- [x] RLS prevents cross-org photo access

## Storage Setup Required

Create storage bucket `shift-photos` in Supabase Dashboard with policy:
- Authenticated users can upload to `{org_id}/*`
- Authenticated users can read from their org folder

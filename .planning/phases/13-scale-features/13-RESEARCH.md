# Phase 13: Scale Features - Research

**Researched:** 2026-01-27
**Domain:** Multi-tenancy, SMS notifications, external API integrations (NDIA, Xero), biometric auth, offline photo sync, bulk operations
**Confidence:** MEDIUM-HIGH

## Summary

This phase transforms Ephraim Care from a single-provider system into a multi-tenant SaaS platform with external integrations. The scope covers eight major feature areas: multi-organization tenancy (extending existing RLS), SMS reminders (via Twilio), participant goal tracking, NDIA API integration for claims, Xero API integration for accounting sync, biometric login for the mobile app, advanced offline support (photos), and bulk shift creation.

The existing codebase already has strong foundations for multi-tenancy. All tables have `organization_id` columns with RLS policies enforcing isolation via `get_user_organization_id()` helper functions. The extension to multi-org is primarily about onboarding flows, platform admin capabilities, and organization settings for external API credentials.

For external integrations, the NDIA API requires registration with the Digital Partnership Office (DPO) and has strict compliance requirements. This is NOT a simple REST API call - it requires a formal partnership agreement. For MVP, the bulk CSV upload through myplace portal remains the practical approach, with one-click CSV generation + download being the "API integration" in reality. Xero integration is more straightforward with their OAuth2 flow and well-documented Node.js SDK.

**Primary recommendation:** Implement features in dependency order: (1) Multi-org schema + platform admin, (2) Organization settings with API credential storage, (3) SMS via Twilio, (4) Xero integration on invoice finalize, (5) Goal tracking, (6) Mobile biometrics + offline photos, (7) Bulk shifts, (8) NDIA CSV auto-generate (not true API integration due to partnership requirements).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| twilio | ^5.x | SMS sending | Industry standard, excellent Node SDK, delivery tracking, scheduling |
| xero-node | ^5.x | Xero accounting sync | Official Xero SDK, OAuth2, invoice CRUD, contacts |
| expo-local-authentication | ~15.0.x | Biometric auth | Expo SDK 53 native, FaceID/TouchID/Fingerprint |
| expo-image-picker | ~16.0.x | Photo capture | Expo SDK 53, camera + gallery access |
| expo-file-system | ~18.0.x | Offline file storage | Expo SDK 53, document directory persistence |
| expo-secure-store | ~14.0.x | PIN/credential storage | Encrypted keychain/keystore storage |
| date-fns | ^4.1.x | Date calculations for recurring shifts | Tree-shakeable, timezone-aware |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuid | ^11.x | Generate unique IDs for bulk operations | Bulk shift creation preview |
| zod | ^3.24.x | Validate SMS phone numbers, API credentials | Form validation |
| @tanstack/react-query | ^5.64.x | Cache invalidation for multi-org context | Organization switching |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Twilio | MessageBird/Vonage | Twilio has better AU coverage, more docs, higher confidence |
| expo-local-authentication | react-native-biometrics | expo-local-auth is Expo-native, no config plugin needed |
| Direct NDIA API | Bulk CSV upload | NDIA API requires formal DPP partnership; CSV is immediate |

**Installation (apps/admin):**
```bash
pnpm add twilio xero-node
```

**Installation (apps/worker-mobile):**
```bash
pnpm add expo-image-picker expo-file-system
# expo-local-authentication already in app.json plugins
```

## Architecture Patterns

### Recommended Project Structure Extensions
```
apps/
├── admin/
│   ├── app/
│   │   ├── (platform-admin)/       # NEW: Platform admin routes
│   │   │   ├── organizations/      # Org management
│   │   │   └── billing/            # Per-participant billing
│   │   ├── settings/
│   │   │   ├── integrations/       # NEW: Xero, SMS credentials
│   │   │   └── ...
│   │   └── participants/
│   │       └── [id]/
│   │           └── goals/          # NEW: Goal tracking
│   ├── lib/
│   │   ├── sms/                    # NEW: Twilio helpers
│   │   │   ├── send-sms.ts
│   │   │   └── templates.ts
│   │   ├── xero/                   # NEW: Xero client + sync
│   │   │   ├── client.ts
│   │   │   └── sync-invoice.ts
│   │   └── ndia/                   # NEW: NDIA CSV generation
│   │       └── generate-claim-csv.ts
│   └── hooks/
│       ├── use-goals.ts            # NEW: Goal CRUD
│       └── use-bulk-shifts.ts      # NEW: Bulk shift creation
├── worker-mobile/
│   ├── lib/
│   │   ├── biometrics.ts           # NEW: Biometric auth helpers
│   │   └── photo-sync.ts           # NEW: Offline photo management
│   └── stores/
│       └── syncStore.ts            # EXTEND: Add photo_attachment type
supabase/
├── migrations/
│   └── 20260127000001_scale_features.sql  # Goals, org settings, SMS logs
```

### Pattern 1: Multi-Organization Self-Service Onboarding
**What:** New organizations can sign up and get instant access with isolated data
**When to use:** Organization registration flow

```typescript
// apps/admin/app/api/organizations/register/route.ts
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { orgName, adminEmail, adminPassword, abn } = await req.json()

  // Use service role to create org + initial admin
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: orgName,
      abn,
      status: 'active',
      settings: {
        sms_enabled: false,
        xero_connected: false,
        ndia_registered: false,
      }
    })
    .select()
    .single()

  if (orgError) throw orgError

  // 2. Create admin user via auth API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  })

  if (authError) throw authError

  // 3. Create profile + role assignment
  await supabase.from('profiles').insert({
    id: authData.user.id,
    email: adminEmail,
    role: 'admin',
    organization_id: org.id,
  })

  await supabase.from('user_roles').insert({
    user_id: authData.user.id,
    role: 'admin',
    organization_id: org.id,
  })

  return Response.json({ success: true, organizationId: org.id })
}
```

### Pattern 2: Platform Admin with Organization Impersonation
**What:** Platform admin can view all orgs and impersonate for support
**When to use:** Support/admin dashboard

```sql
-- Platform admin role (separate from org admin)
ALTER TABLE profiles ADD COLUMN is_platform_admin boolean DEFAULT false;

-- Platform admin can read ALL organizations
CREATE POLICY "platform_admin_read_all"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = auth.uid())
  );

-- Cross-org helper for platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- RLS policy update pattern for all tables
CREATE POLICY "platform_admin_read_participants"
  ON participants FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    OR is_platform_admin()
  );
```

### Pattern 3: Twilio SMS Sending with Scheduled Reminders
**What:** Send SMS shift reminders 24h and 2h before shifts
**When to use:** Scheduled job (pg_cron) or Supabase Edge Function

```typescript
// apps/admin/lib/sms/send-sms.ts
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export interface SendSmsParams {
  to: string // E.164 format: +614xxxxxxxx
  body: string
  organizationId: string
}

export async function sendSms(params: SendSmsParams): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const message = await client.messages.create({
      body: params.body,
      to: params.to,
      from: process.env.TWILIO_PHONE_NUMBER!, // Australian number
      statusCallback: `${process.env.NEXT_PUBLIC_ADMIN_URL}/api/sms/status`,
    })

    // Log for audit trail
    await logSmsToDatabase(params.organizationId, params.to, message.sid, 'queued')

    return { success: true, sid: message.sid }
  } catch (error) {
    console.error('SMS send failed:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Shift reminder template
export function shiftReminderSms(params: {
  workerName: string
  participantName: string
  date: string
  time: string
}): string {
  return `Hi ${params.workerName}, reminder: You have a shift with ${params.participantName} on ${params.date} at ${params.time}. - Ephraim Care`
}
```

```sql
-- Scheduled SMS reminders via pg_cron (extends existing pattern)
-- Run every hour to check for shifts needing reminders
SELECT cron.schedule(
  'shift-sms-reminders',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/cron/send-shift-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret'))
  );
  $$
);
```

### Pattern 4: Xero OAuth2 Integration
**What:** Connect org to Xero, auto-sync invoices on finalize
**When to use:** Invoice finalization hook

```typescript
// apps/admin/lib/xero/client.ts
import { XeroClient, Invoice, LineItem } from 'xero-node'

export async function getXeroClient(organizationId: string): Promise<XeroClient | null> {
  // Fetch org's stored Xero credentials from DB
  const supabase = createAdminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('xero_token_set, xero_tenant_id')
    .eq('id', organizationId)
    .single()

  if (!org?.xero_token_set) return null

  const xero = new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [`${process.env.NEXT_PUBLIC_ADMIN_URL}/api/xero/callback`],
    scopes: ['openid', 'profile', 'email', 'accounting.transactions', 'offline_access'],
  })

  await xero.initialize()
  await xero.setTokenSet(org.xero_token_set)

  // Refresh if expired
  if (org.xero_token_set.expired?.()) {
    const newTokenSet = await xero.refreshToken()
    await supabase
      .from('organizations')
      .update({ xero_token_set: newTokenSet })
      .eq('id', organizationId)
  }

  return xero
}

// apps/admin/lib/xero/sync-invoice.ts
export async function syncInvoiceToXero(invoiceId: string): Promise<{ success: boolean; xeroInvoiceId?: string }> {
  const supabase = createAdminClient()

  // Fetch invoice with line items
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      participant:participants(first_name, last_name, email, ndis_number),
      line_items:invoice_line_items(*)
    `)
    .eq('id', invoiceId)
    .single()

  const xero = await getXeroClient(invoice.organization_id)
  if (!xero) return { success: false }

  const { data: org } = await supabase
    .from('organizations')
    .select('xero_tenant_id, xero_contact_mapping')
    .eq('id', invoice.organization_id)
    .single()

  // Map participant to Xero contact (or create)
  let contactId = org.xero_contact_mapping?.[invoice.participant_id]
  if (!contactId) {
    const contact = await xero.accountingApi.createContacts(org.xero_tenant_id, {
      contacts: [{
        name: `${invoice.participant.first_name} ${invoice.participant.last_name}`,
        emailAddress: invoice.participant.email,
        accountNumber: invoice.participant.ndis_number,
      }]
    })
    contactId = contact.body.contacts?.[0]?.contactID
  }

  // Create Xero invoice
  const lineItems: LineItem[] = invoice.line_items.map(item => ({
    description: item.description,
    quantity: item.quantity,
    unitAmount: item.unit_price,
    accountCode: '200', // Revenue account - configurable per org
    taxType: 'EXEMPTOUTPUT', // NDIS is GST-free
    lineAmount: item.total,
  }))

  const xeroInvoice: Invoice = {
    type: Invoice.TypeEnum.ACCREC,
    contact: { contactID: contactId },
    lineItems,
    date: invoice.date,
    dueDate: invoice.due_date,
    reference: invoice.number,
    status: Invoice.StatusEnum.AUTHORISED,
  }

  const result = await xero.accountingApi.createInvoices(
    org.xero_tenant_id,
    { invoices: [xeroInvoice] }
  )

  // Store Xero invoice ID for reconciliation
  const xeroInvoiceId = result.body.invoices?.[0]?.invoiceID
  await supabase
    .from('invoices')
    .update({ xero_invoice_id: xeroInvoiceId })
    .eq('id', invoiceId)

  return { success: true, xeroInvoiceId }
}
```

### Pattern 5: Biometric Authentication with PIN Fallback
**What:** Workers authenticate with fingerprint/face, PIN as fallback
**When to use:** Worker mobile app login

```typescript
// apps/worker-mobile/lib/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

const PIN_KEY = 'worker_pin'

export async function checkBiometricSupport(): Promise<{
  supported: boolean
  enrolled: boolean
  type: 'fingerprint' | 'facial' | 'none'
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()

  let type: 'fingerprint' | 'facial' | 'none' = 'none'
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    type = 'facial'
  } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    type = 'fingerprint'
  }

  return { supported: hasHardware, enrolled: isEnrolled, type }
}

export async function authenticateWithBiometrics(): Promise<{ success: boolean; error?: string }> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to check in',
    fallbackLabel: 'Use PIN',
    disableDeviceFallback: true, // We handle our own PIN fallback
  })

  if (result.success) {
    return { success: true }
  }

  return { success: false, error: result.error }
}

export async function setPin(pin: string): Promise<void> {
  // Hash PIN before storing
  const hashedPin = await hashPin(pin)
  await SecureStore.setItemAsync(PIN_KEY, hashedPin)
}

export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(PIN_KEY)
  if (!storedHash) return false

  const inputHash = await hashPin(pin)
  return storedHash === inputHash
}

async function hashPin(pin: string): Promise<string> {
  // Simple hash for PIN - in production use proper crypto
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'ephraimcare_salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

### Pattern 6: Offline Photo Capture with Sync Queue
**What:** Capture photos during shift, store locally, sync when online
**When to use:** Shift check-in/out with evidence photos

```typescript
// apps/worker-mobile/lib/photo-sync.ts
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { useSyncStore, PendingAction } from '../stores/syncStore'

const PHOTO_DIR = FileSystem.documentDirectory + 'shift_photos/'

export interface CapturedPhoto {
  id: string
  uri: string
  shiftId: string
  timestamp: string
  uploaded: boolean
}

// Ensure photo directory exists
export async function ensurePhotoDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true })
  }
}

// Capture photo and save locally
export async function captureShiftPhoto(shiftId: string): Promise<CapturedPhoto | null> {
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7, // Compress for storage
    allowsEditing: false,
    base64: false,
  })

  if (result.canceled) return null

  await ensurePhotoDir()

  const asset = result.assets[0]
  const photoId = `${shiftId}_${Date.now()}`
  const localUri = `${PHOTO_DIR}${photoId}.jpg`

  // Move to permanent location
  await FileSystem.moveAsync({
    from: asset.uri,
    to: localUri,
  })

  const photo: CapturedPhoto = {
    id: photoId,
    uri: localUri,
    shiftId,
    timestamp: new Date().toISOString(),
    uploaded: false,
  }

  // Queue for sync
  useSyncStore.getState().addPendingAction({
    type: 'photo_attachment',
    shiftId,
    timestamp: photo.timestamp,
    latitude: 0, // Not needed for photos
    longitude: 0,
    payload: { photoId, localUri },
  })

  return photo
}

// Get pending photos for a shift (max 3 per CONTEXT.md)
export async function getShiftPhotos(shiftId: string): Promise<CapturedPhoto[]> {
  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR)
  if (!dirInfo.exists) return []

  const files = await FileSystem.readDirectoryAsync(PHOTO_DIR)
  const shiftPhotos = files.filter(f => f.startsWith(shiftId))

  return shiftPhotos.map(filename => ({
    id: filename.replace('.jpg', ''),
    uri: PHOTO_DIR + filename,
    shiftId,
    timestamp: '', // Would need to store metadata
    uploaded: false,
  }))
}

// Upload photo to Supabase Storage
export async function uploadPhoto(photo: CapturedPhoto): Promise<string | null> {
  try {
    const fileContent = await FileSystem.readAsStringAsync(photo.uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Upload to Supabase Storage via API route
    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: photo.id,
        shiftId: photo.shiftId,
        base64: fileContent,
      }),
    })

    if (!response.ok) throw new Error('Upload failed')

    const { url } = await response.json()

    // Delete local file after successful upload
    await FileSystem.deleteAsync(photo.uri)

    return url
  } catch (error) {
    console.error('Photo upload failed:', error)
    return null
  }
}
```

### Pattern 7: Bulk Shift Creation with Preview
**What:** Create multiple shifts at once ("3x per week for a month")
**When to use:** Recurring schedule setup

```typescript
// apps/admin/hooks/use-bulk-shifts.ts
import { addWeeks, addDays, setHours, setMinutes, isBefore } from 'date-fns'
import { v4 as uuid } from 'uuid'

export interface BulkShiftTemplate {
  participantId: string
  workerId: string
  supportType: string
  daysOfWeek: number[] // 0=Sunday, 1=Monday, etc.
  startHour: number
  startMinute: number
  durationMinutes: number
  notes: string | null
  weeksToGenerate: number
  startDate: Date
}

export interface PreviewShift {
  id: string // Temporary ID for preview
  scheduledStart: Date
  scheduledEnd: Date
  dayName: string
  participantId: string
  workerId: string
  supportType: string
  notes: string | null
  hasConflict: boolean
  conflictReason?: string
}

export function generateBulkShiftPreview(
  template: BulkShiftTemplate,
  existingShifts: { workerId: string; start: Date; end: Date }[]
): PreviewShift[] {
  const preview: PreviewShift[] = []
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  let currentWeekStart = template.startDate

  for (let week = 0; week < template.weeksToGenerate; week++) {
    for (const dayOfWeek of template.daysOfWeek) {
      // Find the date for this day in the current week
      const dayOffset = (dayOfWeek - currentWeekStart.getDay() + 7) % 7
      const shiftDate = addDays(currentWeekStart, dayOffset)

      // Skip if date is before start date
      if (isBefore(shiftDate, template.startDate)) continue

      // Set time
      let start = setHours(shiftDate, template.startHour)
      start = setMinutes(start, template.startMinute)
      const end = new Date(start.getTime() + template.durationMinutes * 60 * 1000)

      // Check for conflicts
      const conflict = existingShifts.find(
        es =>
          es.workerId === template.workerId &&
          ((start >= es.start && start < es.end) || (end > es.start && end <= es.end))
      )

      preview.push({
        id: uuid(),
        scheduledStart: start,
        scheduledEnd: end,
        dayName: dayNames[dayOfWeek],
        participantId: template.participantId,
        workerId: template.workerId,
        supportType: template.supportType,
        notes: template.notes,
        hasConflict: !!conflict,
        conflictReason: conflict ? 'Worker has overlapping shift' : undefined,
      })
    }

    currentWeekStart = addWeeks(currentWeekStart, 1)
  }

  return preview.sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())
}

// Create selected shifts from preview
export async function createBulkShifts(
  shifts: PreviewShift[],
  organizationId: string
): Promise<{ created: number; failed: number }> {
  const supabase = createClient()
  let created = 0
  let failed = 0

  for (const shift of shifts) {
    const { error } = await supabase.from('shifts').insert({
      participant_id: shift.participantId,
      worker_id: shift.workerId,
      support_type: shift.supportType,
      scheduled_start: shift.scheduledStart.toISOString(),
      scheduled_end: shift.scheduledEnd.toISOString(),
      notes: shift.notes,
      organization_id: organizationId,
      status: 'pending',
      bulk_created: true, // Flag for audit
    })

    if (error) {
      failed++
    } else {
      created++
    }
  }

  return { created, failed }
}
```

### Pattern 8: Participant Goal Tracking
**What:** Admin creates goals for participants, workers add progress notes
**When to use:** Care planning and progress monitoring

```sql
-- Goal tracking tables
CREATE TABLE participant_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES participants(id) NOT NULL,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  title text NOT NULL,
  description text,
  target_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'discontinued')),
  category text CHECK (category IN ('daily_living', 'community', 'employment', 'relationships', 'health', 'other')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

CREATE TABLE goal_progress_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES participant_goals(id) NOT NULL,
  shift_id uuid REFERENCES shifts(id), -- Optional link to shift
  worker_id uuid REFERENCES workers(id),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  note text NOT NULL,
  progress_rating integer CHECK (progress_rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE participant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_goals" ON participant_goals
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "admin_manage_goals" ON participant_goals
  FOR ALL TO authenticated
  USING (is_admin_or_coordinator() AND organization_id = get_user_organization_id());

CREATE POLICY "workers_add_progress" ON goal_progress_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid())
    AND organization_id = get_user_organization_id()
  );
```

### Anti-Patterns to Avoid
- **Direct NDIA API without DPP registration:** The NDIA API requires formal partnership. Don't build assuming API access - build CSV generation + one-click download as the practical "integration".
- **Storing Xero tokens unencrypted:** Always encrypt OAuth tokens at rest. Use column-level encryption or Supabase Vault.
- **Unlimited offline photos:** Cap at 3 photos per shift per CONTEXT.md to prevent storage bloat on worker devices.
- **SMS without opt-out:** Always check `sms_notifications_enabled` profile field before sending. Respect STOP replies.
- **Platform admin without audit:** All cross-org operations by platform admin must be logged to audit trail.
- **Bulk shift creation without preview:** Always show preview with conflict detection before creating. Never auto-create without user review.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMS delivery | Raw HTTP to carriers | Twilio SDK | Delivery tracking, retry, phone validation, AU compliance |
| Xero auth | Manual OAuth2 flow | xero-node SDK | Token refresh, tenant management, typed responses |
| Biometric auth | Native module bridge | expo-local-authentication | Cross-platform, handles FaceID/TouchID/Fingerprint |
| Photo compression | Manual image processing | ImagePicker quality option | Built-in, consistent across iOS/Android |
| Recurring dates | Manual date math | date-fns addWeeks/addDays | DST-aware, timezone-correct |
| File storage | AsyncStorage for files | expo-file-system | Proper filesystem access, large file support |
| NDIA claims | Direct API integration | CSV generation | API requires partnership; CSV works immediately |
| PIN hashing | Plain text storage | crypto.subtle.digest | Security requirement for credential storage |

**Key insight:** External API integrations (NDIA, Xero) have compliance and partnership requirements that affect timeline. Build for the practical path first (CSV, OAuth), then enhance as partnerships mature.

## Common Pitfalls

### Pitfall 1: NDIA API Partnership Assumption
**What goes wrong:** Building for direct NDIA API access, then discovering it requires formal DPP registration and compliance review
**Why it happens:** API documentation exists, but access requires partnership agreement with DPO@ndis.gov.au
**How to avoid:** For MVP, implement one-click PACE CSV generation. Add API integration as separate Phase 14 after partnership established.
**Warning signs:** No NDIA API credentials in hand; no DPP agreement signed

### Pitfall 2: Xero Token Expiry Mid-Sync
**What goes wrong:** Invoice sync fails because OAuth token expired during long-running operation
**Why it happens:** Xero tokens expire after 30 minutes
**How to avoid:** Check `tokenSet.expired()` before every API call, refresh proactively, wrap in retry logic
**Warning signs:** Intermittent 401 errors from Xero API

### Pitfall 3: SMS Costs Explosion
**What goes wrong:** Unexpected Twilio bill from too many SMS messages
**Why it happens:** Sending SMS to all shifts without checking opt-in status or deduplication
**How to avoid:** Always check profile `sms_notifications_enabled`, dedupe by phone+message within window, log all sends
**Warning signs:** No SMS log table; no opt-out check in send function

### Pitfall 4: Biometric Fallback Loop
**What goes wrong:** User gets stuck when biometrics fail and PIN hasn't been set
**Why it happens:** Biometric setup during onboarding but no PIN fallback configured
**How to avoid:** Require PIN setup during worker onboarding. Biometrics optional, PIN mandatory.
**Warning signs:** `hasHardware` false cases not handled; no PIN setup screen in onboarding

### Pitfall 5: Offline Photo Storage Bloat
**What goes wrong:** Worker device runs out of storage from accumulated shift photos
**Why it happens:** Photos not deleted after sync; no limit on photos per shift
**How to avoid:** Delete local file after successful Supabase upload; enforce 3-photo limit per shift
**Warning signs:** Photos directory grows unbounded; no cleanup after upload

### Pitfall 6: Bulk Shift Notification Storm
**What goes wrong:** Creating 100 shifts sends 100 individual notification emails/SMS
**Why it happens:** Existing shift creation hook sends notification per shift
**How to avoid:** Bulk creation should send single summary notification, not per-shift
**Warning signs:** `sendShiftAssignmentEmail` called in loop without batching

### Pitfall 7: Multi-Org RLS Policy Gaps
**What goes wrong:** Data leaks between organizations via join tables or indirect access
**Why it happens:** New tables/views added without RLS; platform admin bypass not scoped
**How to avoid:** Audit every table for RLS policy; test cross-org access explicitly
**Warning signs:** Tables without `organization_id` column; no RLS enabled check in migration

### Pitfall 8: Goal Progress Without Shift Context
**What goes wrong:** Progress notes added without connecting to actual care delivery
**Why it happens:** Goal progress form accessible from anywhere, not linked to shifts
**How to avoid:** Link progress notes to shift_id when worker is clocked in; require shift context for worker entries
**Warning signs:** goal_progress_notes.shift_id is null for most entries

## Code Examples

### SMS Reminder Cron Job (Supabase Edge Function)
```typescript
// supabase/functions/shift-sms-reminders/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  // Find shifts needing 24h reminder
  const { data: shifts24h } = await supabase
    .from('shifts')
    .select(`
      id,
      scheduled_start,
      worker:workers(
        profile:profiles(first_name, phone, sms_notifications_enabled)
      ),
      participant:participants(first_name, last_name)
    `)
    .gte('scheduled_start', now.toISOString())
    .lte('scheduled_start', in24Hours.toISOString())
    .is('reminder_24h_sent', false)
    .in('status', ['pending', 'confirmed'])

  // Send SMS for each (check opt-in)
  for (const shift of shifts24h || []) {
    if (!shift.worker?.profile?.sms_notifications_enabled) continue
    if (!shift.worker?.profile?.phone) continue

    await sendShiftReminder(shift, '24h')

    await supabase
      .from('shifts')
      .update({ reminder_24h_sent: true })
      .eq('id', shift.id)
  }

  // Similar for 2h reminders...

  return new Response(JSON.stringify({ sent: shifts24h?.length || 0 }))
})
```

### Organization Settings Page (Credentials Storage)
```typescript
// apps/admin/app/settings/integrations/page.tsx
'use client'

import { useState } from 'react'
import { useOrganization } from '@/hooks/use-organization'
import { Card, CardContent, CardHeader, CardTitle } from '@ephraimcare/ui/components/card'
import { Button } from '@ephraimcare/ui/components/button'
import { Input } from '@ephraimcare/ui/components/input'

export default function IntegrationsPage() {
  const { organization, updateSettings } = useOrganization()

  const handleXeroConnect = async () => {
    // Redirect to Xero OAuth consent URL
    window.location.href = '/api/xero/connect'
  }

  const handleTwilioSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    await updateSettings({
      twilio_account_sid: formData.get('accountSid'),
      twilio_auth_token: formData.get('authToken'),
      twilio_phone_number: formData.get('phoneNumber'),
      sms_enabled: true,
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Integrations</h1>

      {/* Xero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Xero Accounting</CardTitle>
        </CardHeader>
        <CardContent>
          {organization?.xero_connected ? (
            <div className="flex items-center gap-2">
              <span className="text-green-600">Connected</span>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
          ) : (
            <Button onClick={handleXeroConnect}>Connect to Xero</Button>
          )}
        </CardContent>
      </Card>

      {/* Twilio SMS Section */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Notifications (Twilio)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTwilioSave} className="space-y-4">
            <Input
              name="accountSid"
              label="Account SID"
              placeholder="ACxxxxxxxx"
              defaultValue={organization?.twilio_account_sid || ''}
            />
            <Input
              name="authToken"
              label="Auth Token"
              type="password"
              placeholder="••••••••"
            />
            <Input
              name="phoneNumber"
              label="Twilio Phone Number"
              placeholder="+61xxxxxxxxx"
              defaultValue={organization?.twilio_phone_number || ''}
            />
            <Button type="submit">Save SMS Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Goal Progress Entry (Mobile)
```typescript
// apps/worker-mobile/components/GoalProgressModal.tsx
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useGoalProgress } from '../hooks/useGoalProgress'

interface Props {
  goalId: string
  goalTitle: string
  shiftId: string
  onClose: () => void
}

export function GoalProgressModal({ goalId, goalTitle, shiftId, onClose }: Props) {
  const [note, setNote] = useState('')
  const [rating, setRating] = useState<number>(3)
  const { addProgress, isLoading } = useGoalProgress()

  const handleSubmit = async () => {
    await addProgress({
      goalId,
      shiftId,
      note,
      progressRating: rating,
    })
    onClose()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress: {goalTitle}</Text>

      <TextInput
        style={styles.input}
        multiline
        placeholder="How did the participant progress on this goal today?"
        value={note}
        onChangeText={setNote}
        minLength={10}
      />

      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.ratingButton, rating === n && styles.ratingSelected]}
            onPress={() => setRating(n)}
          >
            <Text>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingLabel}>1 = No progress, 5 = Excellent progress</Text>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isLoading || note.length < 10}
      >
        <Text style={styles.submitText}>Save Progress</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, minHeight: 100 },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  ratingButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ratingSelected: { backgroundColor: '#66BB6A', borderColor: '#66BB6A' },
  ratingLabel: { textAlign: 'center', color: '#666', marginTop: 8 },
  submitButton: { backgroundColor: '#66BB6A', padding: 16, borderRadius: 8, marginTop: 16 },
  submitText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NDIA CSV manual upload | NDIA API via DPP | 2024-2025 | Requires partnership; CSV still valid fallback |
| Xero private app | Xero OAuth2 apps | 2021 | Must use OAuth2, private apps deprecated |
| expo-local-auth v14 | expo-local-auth v15 | Expo SDK 53 | FaceID permission in app.json required |
| expo-file-system import | expo-file-system/legacy | Expo SDK 53 | Legacy module for full feature parity |
| twilio v4 | twilio v5 | 2024 | Promise-based, ES modules |

**Deprecated/outdated:**
- NDIA single-line claims in portal (replaced by bulk upload for PACE participants)
- Xero private applications (OAuth2 required since 2021)
- `expo-file-system` direct import for some methods (use `/legacy` for downloadAsync)

## Open Questions

1. **NDIA Digital Partnership Timeline**
   - What we know: API access requires DPO registration at DPO@ndis.gov.au, cyber assessment, and partnership agreement
   - What's unclear: How long the partnership approval takes; whether it's viable for Phase 13 timeline
   - Recommendation: Build CSV generation as primary path. Add API integration as Phase 14 after partnership established.

2. **Xero Account Code Configuration**
   - What we know: Invoices need account codes (e.g., '200' for revenue) to map to chart of accounts
   - What's unclear: Whether to hardcode or make configurable per organization
   - Recommendation: Add `xero_revenue_account_code` to organization settings, default to '200'

3. **SMS Carrier STOP Handling**
   - What we know: Twilio handles carrier-level STOP automatically; we also need app-level opt-out toggle
   - What's unclear: How to reconcile carrier STOP with profile setting (carrier STOP not visible to app)
   - Recommendation: Trust carrier STOP (Twilio blocks sends). Profile toggle is user preference only.

4. **Multi-Org Pricing Model Implementation**
   - What we know: Per-participant pricing decided in CONTEXT.md
   - What's unclear: Whether billing integration needed in Phase 13 or separate billing phase
   - Recommendation: Store participant count; defer payment processing to dedicated billing phase

5. **Conflict Resolution UI for Offline Photos**
   - What we know: CONTEXT.md says "prompt worker to choose which version to keep"
   - What's unclear: What exact conflict scenarios require resolution (server has newer? different photo?)
   - Recommendation: Simplify to "upload failed, retry?" rather than complex merge UI

## Sources

### Primary (HIGH confidence)
- [Twilio Node.js SDK](https://github.com/twilio/twilio-node) - SMS sending patterns
- [Xero Node SDK](https://github.com/xeroapi/xero-node) - OAuth2 + invoice creation
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication) - Biometric auth
- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem) - Offline file storage
- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker) - Photo capture

### Secondary (MEDIUM confidence)
- [NDIS Connecting with NDIA Systems](https://www.ndis.gov.au/providers/working-provider/connecting-ndia-systems) - API partnership requirements
- [NDIS Bulk Payments](https://www.ndis.gov.au/providers/working-provider/getting-paid/bulk-payments) - CSV upload process
- [PACE Technical Documentation](https://www.ndis.gov.au/media/6124/download) - Bulk claim requirements

### Tertiary (LOW confidence)
- WebSearch results on NDIA API implementation timelines (no authoritative source found)
- Community discussions on multi-tenant Supabase patterns (verify with official docs)

## Metadata

**Confidence breakdown:**
- Multi-tenancy: HIGH - Existing RLS patterns extend naturally; Supabase well-documented
- SMS (Twilio): HIGH - Official SDK with excellent documentation
- Xero integration: HIGH - Official SDK with full OAuth2 support
- Biometrics: HIGH - expo-local-authentication is Expo native with good docs
- Offline photos: MEDIUM - Pattern clear but edge cases (sync conflicts) need validation
- NDIA API: LOW - Requires partnership; practical path is CSV generation
- Goal tracking: MEDIUM - Standard CRUD, but UX patterns need validation
- Bulk shifts: MEDIUM - Date math verified, but preview UI needs testing

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - integrations stable, NDIA API status may change)

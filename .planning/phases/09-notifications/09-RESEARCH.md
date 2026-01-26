# Phase 9: Notifications - Research

**Researched:** 2026-01-26
**Domain:** Email notifications via Resend API
**Confidence:** HIGH

## Summary

This phase implements email notifications for three events: shift assignments, shift cancellations, and invoice finalizations. The research focused on integrating Resend (the decided email service) with the existing Next.js App Router API routes using a fire-and-forget pattern.

The codebase already has a working Resend integration pattern in `/apps/admin/app/api/workers/invite/route.ts` that uses raw `fetch()` calls to the Resend API. This pattern should be replicated for notifications. The existing utility functions in `@ephraimcare/utils` provide timezone-aware date formatting that should be used for email content.

**Primary recommendation:** Create a shared `sendNotificationEmail()` helper function in `/apps/admin/lib/notifications/` that wraps Resend API calls with fire-and-forget semantics, then call it from the existing create/cancel/finalize mutation hooks.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Resend API | REST v1 | Email delivery | Already in use for worker invites, modern API, simple setup |
| date-fns | ^4.1.0 | Date formatting | Already in project, used everywhere |
| @date-fns/tz | ^1.2.0 | Sydney timezone handling | Already in project via `@ephraimcare/utils` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native fetch | Built-in | HTTP requests to Resend | All email sends |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw fetch | resend npm package | SDK adds 50KB, provides types but we need minimal functionality |
| Inline HTML | React Email | Overkill for 3 simple templates; decided against in CONTEXT.md |

**Installation:**
```bash
# No new packages needed - Resend API is called via fetch
# RESEND_API_KEY already in .env.example
```

## Architecture Patterns

### Recommended Project Structure
```
apps/admin/lib/notifications/
├── send-email.ts        # Core sendNotificationEmail() helper
├── templates.ts         # HTML template strings for each notification type
└── types.ts             # Type definitions for notification payloads
```

### Pattern 1: Fire-and-Forget with Error Logging

**What:** Send email without awaiting response, log errors but don't block the main operation.

**When to use:** All notification emails. The DB operation must succeed regardless of email delivery.

**Example:**
```typescript
// Source: Existing pattern in /apps/admin/app/api/workers/invite/route.ts
// Modified for fire-and-forget

export async function sendNotificationEmail(params: NotificationEmailParams): Promise<void> {
  // Don't await - fire and forget
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Ephraim Care <noreply@ephraimcare.com.au>',
      to: params.to,
      cc: params.cc,
      subject: params.subject,
      html: params.html,
    }),
  }).catch((err) => {
    // Log but don't throw - email failure shouldn't block the operation
    console.error('Notification email failed:', err)
  })
}
```

### Pattern 2: Mutation Hook Integration

**What:** Call notification helper AFTER successful DB mutation, not inside transaction.

**When to use:** All three notification events.

**Example:**
```typescript
// Source: Pattern derived from existing use-create-shift.ts

export function useCreateShift() {
  return useMutation({
    mutationFn: async (input: CreateShiftInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('shifts')
        .insert({ ... })
        .select('id, worker:workers(profile:profiles(email, first_name)), ...')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Fire-and-forget notification AFTER DB success
      sendShiftAssignmentEmail({
        workerEmail: data.worker.profile.email,
        workerName: data.worker.profile.first_name,
        shiftDate: data.scheduled_start,
        participantName: data.participant.first_name,
        shiftId: data.id,
      })

      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({ title: 'Shift scheduled successfully' })
    },
  })
}
```

### Pattern 3: Simple Inline HTML Templates

**What:** Template literal functions returning clean HTML strings with inline CSS.

**When to use:** All email templates.

**Example:**
```typescript
// Source: Based on existing invite email pattern + best practices

export function shiftAssignmentTemplate(params: {
  workerName: string
  date: string      // Formatted: "Monday, 27 Jan 2026"
  time: string      // Formatted: "9:00 AM - 1:00 PM"
  participantName: string
  viewUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #66BB6A; margin-bottom: 16px;">New Shift Assigned</h2>
  <p>Hi ${params.workerName},</p>
  <p>You have a new shift:</p>
  <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Date:</strong> ${params.date}</p>
    <p style="margin: 8px 0 0;"><strong>Time:</strong> ${params.time}</p>
    <p style="margin: 8px 0 0;"><strong>Participant:</strong> ${params.participantName}</p>
  </div>
  <a href="${params.viewUrl}" style="display: inline-block; background: #66BB6A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Shift Details</a>
  <p style="color: #666; font-size: 12px; margin-top: 32px;">Ephraim Care</p>
</body>
</html>
  `.trim()
}
```

### Anti-Patterns to Avoid
- **Awaiting email sends in mutation:** Blocks user action on email delivery; use fire-and-forget instead
- **Sending before DB commit:** Risk of notifying about failed operations; always notify AFTER success
- **Complex React Email templates:** Decided against in CONTEXT.md; simple HTML strings are sufficient
- **Multiple recipients in TO field:** Use CC for admin, not multiple TO entries (Resend best practice)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date/time formatting | Custom formatters | `formatSydneyDate()` from `@ephraimcare/utils` | Already handles AEST/AEDT, consistent across app |
| Email HTML | Complex template engine | Simple template literal functions | 3 templates is not enough to justify complexity |
| Email validation | Regex validation | Skip - Supabase already validated emails on user creation | Redundant validation adds no value |

**Key insight:** The notification system is intentionally simple. Email delivery failures are acceptable (fire-and-forget), and the templates are minimal. Don't over-engineer.

## Common Pitfalls

### Pitfall 1: Missing RESEND_API_KEY in Production
**What goes wrong:** Emails silently fail, users never notified.
**Why it happens:** Environment variable not set in deployment platform.
**How to avoid:** Add `RESEND_API_KEY` to Vercel/deployment env vars before deploying this phase.
**Warning signs:** No errors in logs (fire-and-forget swallows them), but users report not receiving emails.

### Pitfall 2: Wrong Timezone in Email Content
**What goes wrong:** Email shows "9:00 AM" but shift is actually at 9:00 AM Sydney time, which is different for recipients in other timezones.
**Why it happens:** Using raw date without timezone context.
**How to avoid:** Always use `formatSydneyDate()` and explicitly state "AEST" or "AEDT" in the email.
**Warning signs:** Workers confused about shift times.

### Pitfall 3: Email Sent Before DB Transaction Commits
**What goes wrong:** Notification sent for shift that failed to save.
**Why it happens:** Calling notification inside mutation function before error check.
**How to avoid:** Only call `sendNotificationEmail()` in `onSuccess` callback or after confirmed DB success.
**Warning signs:** Users receive notifications for shifts/invoices that don't exist.

### Pitfall 4: Blocking on Email Delivery
**What goes wrong:** Shift creation takes 2-3 seconds instead of <500ms.
**Why it happens:** `await`ing the fetch call to Resend.
**How to avoid:** Don't await. Let the promise resolve independently.
**Warning signs:** Slow mutation responses, timeout errors.

### Pitfall 5: CC to Large Lists
**What goes wrong:** Emails flagged as spam.
**Why it happens:** Using BCC or CC for multiple recipients like a mailing list.
**How to avoid:** Per CONTEXT.md, only CC admin email (`ephraimcare252@gmail.com`). Never blast to BCC lists.
**Warning signs:** Emails going to spam folders.

## Code Examples

### Email Send Helper (Core Pattern)
```typescript
// Source: Based on existing /apps/admin/app/api/workers/invite/route.ts

interface NotificationEmailParams {
  to: string | string[]
  cc?: string | string[]
  subject: string
  html: string
}

const ADMIN_EMAIL = 'ephraimcare252@gmail.com'

export function sendNotificationEmail(params: NotificationEmailParams): void {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email')
    return
  }

  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Ephraim Care <noreply@ephraimcare.com.au>',
      to: Array.isArray(params.to) ? params.to : [params.to],
      cc: params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : undefined,
      subject: params.subject,
      html: params.html,
    }),
  }).catch((err) => {
    console.error('Notification email failed:', err)
  })
}
```

### Shift Assignment Notification
```typescript
// Source: Requirements NOTF-01

import { formatSydneyDate } from '@ephraimcare/utils'

export function sendShiftAssignmentEmail(params: {
  workerEmail: string
  workerName: string
  scheduledStart: string
  scheduledEnd: string
  participantName: string
  shiftId: string
}): void {
  const dateStr = formatSydneyDate(params.scheduledStart, 'EEEE, d MMMM yyyy')
  const startTime = formatSydneyDate(params.scheduledStart, 'h:mm a')
  const endTime = formatSydneyDate(params.scheduledEnd, 'h:mm a')
  const workerAppUrl = process.env.NEXT_PUBLIC_WORKER_APP_URL || 'https://worker.ephraimcare.com.au'

  sendNotificationEmail({
    to: params.workerEmail,
    cc: ADMIN_EMAIL,
    subject: `New Shift: ${dateStr}`,
    html: shiftAssignmentTemplate({
      workerName: params.workerName,
      date: dateStr,
      time: `${startTime} - ${endTime}`,
      participantName: params.participantName,
      viewUrl: `${workerAppUrl}/shift/${params.shiftId}`,
    }),
  })
}
```

### Shift Cancellation Notification
```typescript
// Source: Requirements NOTF-02

export function sendShiftCancellationEmail(params: {
  workerEmail: string
  workerName: string
  participantEmail: string | null
  participantName: string
  scheduledStart: string
  cancellationReason: string
}): void {
  const dateStr = formatSydneyDate(params.scheduledStart, 'EEEE, d MMMM yyyy')
  const timeStr = formatSydneyDate(params.scheduledStart, 'h:mm a')

  // Email to worker
  sendNotificationEmail({
    to: params.workerEmail,
    cc: ADMIN_EMAIL,
    subject: `Shift Cancelled: ${dateStr}`,
    html: shiftCancellationTemplate({
      recipientName: params.workerName,
      date: dateStr,
      time: timeStr,
      participantName: params.participantName,
      reason: params.cancellationReason,
    }),
  })

  // Email to participant (if they have email)
  if (params.participantEmail) {
    sendNotificationEmail({
      to: params.participantEmail,
      cc: ADMIN_EMAIL,
      subject: `Shift Cancelled: ${dateStr}`,
      html: shiftCancellationTemplate({
        recipientName: params.participantName,
        date: dateStr,
        time: timeStr,
        participantName: params.participantName,
        reason: params.cancellationReason,
      }),
    })
  }
}
```

### Invoice Finalized Notification
```typescript
// Source: Requirements NOTF-03

export function sendInvoiceFinalizedEmail(params: {
  participantEmail: string
  participantName: string
  emergencyContactEmail: string | null
  invoiceNumber: string
  invoiceId: string
  total: number
}): void {
  const participantPortalUrl = process.env.NEXT_PUBLIC_PARTICIPANT_URL || 'https://portal.ephraimcare.com.au'
  const recipients = [params.participantEmail]

  // CC emergency contact if on file (for family members managing finances)
  const ccList = [ADMIN_EMAIL]
  if (params.emergencyContactEmail) {
    ccList.push(params.emergencyContactEmail)
  }

  sendNotificationEmail({
    to: recipients,
    cc: ccList,
    subject: `Invoice ${params.invoiceNumber} Ready`,
    html: invoiceFinalizedTemplate({
      participantName: params.participantName,
      invoiceNumber: params.invoiceNumber,
      total: `$${params.total.toFixed(2)}`,
      viewUrl: `${participantPortalUrl}/invoices`,
    }),
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SendGrid/Mailgun | Resend | 2023-2024 | Simpler API, better DX, React Email support |
| Complex email templates | Simple inline HTML | Always for transactional | Faster to build, fewer dependencies |
| Sync email sending | Fire-and-forget async | Best practice | Non-blocking user experience |

**Deprecated/outdated:**
- React Email: Considered but rejected per CONTEXT.md - overkill for 3 simple templates
- Email delivery tracking/webhooks: Explicitly excluded per CONTEXT.md - no logs, no tracking

## Open Questions

1. **Worker Mobile App URL**
   - What we know: Workers use an Expo mobile app, shifts have deep links like `/shift/[id]`
   - What's unclear: Is there a production URL for the worker app, or should we use a universal link scheme?
   - Recommendation: Use env var `NEXT_PUBLIC_WORKER_APP_URL` with fallback, update when production URL is known

2. **Domain Verification**
   - What we know: Resend requires domain verification to send from custom domains
   - What's unclear: Is `ephraimcare.com.au` verified in Resend dashboard?
   - Recommendation: Use `onboarding@resend.dev` for development, verify domain before production

3. **Emergency Contact Email Field**
   - What we know: Participants have `emergency_contact_name` and `emergency_contact_phone` in DB
   - What's unclear: There's no `emergency_contact_email` field
   - Recommendation: Either add migration to add the field, or skip emergency contact CC for v1

## Sources

### Primary (HIGH confidence)
- `/resend/resend-node` via Context7 - SDK installation, API usage, send patterns
- `/websites/resend` via Context7 - Next.js App Router integration, CC/BCC usage
- [Resend API Errors Documentation](https://resend.com/docs/api-reference/errors) - Complete error code reference
- Existing codebase: `/apps/admin/app/api/workers/invite/route.ts` - Proven Resend integration pattern

### Secondary (MEDIUM confidence)
- [Mailgun Transactional Email Templates](https://www.mailgun.com/blog/email/transactional-html-email-templates/) - HTML email best practices
- [Postmark Email Templates](https://postmarkapp.com/transactional-email-templates) - Simple template structure patterns

### Tertiary (LOW confidence)
- General web search for fire-and-forget patterns - Verified against existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Resend already in use, no new dependencies
- Architecture: HIGH - Pattern exists in codebase (worker invite), just extending
- Pitfalls: HIGH - Based on Resend documentation and common async patterns

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable domain, minimal external dependencies)

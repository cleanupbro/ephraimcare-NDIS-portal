# Admin API Routes

Next.js API route handlers for server-side operations.

## Routes

| Route | Method | Description |
|-------|--------|-------------|
| **`/api/workers/invite`** | POST | Create worker auth user + profile + send invite email |
| **`/api/workers/resend-invite`** | POST | Resend magic link invite email to worker |
| **`/api/organizations/register`** | POST | Register new organization (admin signup) |
| **`/api/admin/run-migration`** | POST | Run database migrations (admin only) |
| **`/api/invoices/generate`** | POST | Generate invoice from completed shifts in date range |
| **`/api/invoices/[id]/pdf`** | GET | Generate invoice PDF download |
| **`/api/invoices/[id]/finalize`** | POST | Mark invoice as finalized/paid |
| **`/api/invoices/export-csv`** | GET | Batch export invoices as CSV |
| **`/api/ndia/generate-csv`** | POST | NDIA-format claim CSV export (PACE format) |
| **`/api/shifts/[id]/override-checkout`** | POST | Admin override for missed checkout |
| **`/api/shifts/recurring`** | POST | Create recurring shift template |
| **`/api/notifications/bulk-shifts`** | POST | Notify workers of bulk shift assignments |
| **`/api/compliance/report`** | GET | Generate compliance health score report |
| **`/api/cron/send-shift-reminders`** | GET | Cron: send 24h/2h shift reminders (SMS/email) |
| **`/api/photos/upload`** | POST | Upload shift/incident photos |
| **`/api/reports/export/invoices`** | GET | Export invoice report (CSV/Excel) |
| **`/api/reports/export/participants`** | GET | Export participant report |
| **`/api/reports/export/worker-hours`** | GET | Export worker hours report |
| **`/api/sms/test`** | POST | Test SMS integration (Twilio) |
| **`/api/xero/connect`** | GET | Start Xero OAuth2 flow |
| **`/api/xero/callback`** | GET | Handle Xero OAuth callback, store tokens |
| **`/api/xero/disconnect`** | POST | Revoke Xero connection |

## Auth Pattern

All protected routes follow:
1. `createClient()` → get Supabase server client with cookies
2. `getUser()` → verify authentication
3. Query `profiles` table → check role is `admin` or `coordinator`
4. Return 401/403 on failure

## Email Sender

Uses `RESEND_FROM_EMAIL` env var (falls back to `noreply@ephraimcare.com.au`).
Admin CC uses `ADMIN_EMAIL` env var (falls back to `ephraimcare252@gmail.com`).

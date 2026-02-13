# API Key Registry

Master list of all API keys, tokens, and credentials this project uses.

**⚠️ NEVER put actual key values in this file. Only names and metadata.**

## Active Keys

| Service | Env Variable | Purpose | Get It From | Used In |
|---------|-------------|---------|-------------|---------|
| Supabase | NEXT_PUBLIC_SUPABASE_URL | Database URL | Supabase Dashboard > Settings > API | Client-side & Server-side |
| Supabase | NEXT_PUBLIC_SUPABASE_ANON_KEY | Public anon key | Supabase Dashboard > Settings > API | Client-side |
| Supabase | SUPABASE_SERVICE_ROLE_KEY | Server-only admin key | Supabase Dashboard > Settings > API | Server-side (Admin) |
| App | NEXT_PUBLIC_SITE_URL | Admin portal URL | Vercel | Auth redirects |
| App | NEXT_PUBLIC_ADMIN_URL | Admin portal URL | Vercel | Notifications |
| App | NEXT_PUBLIC_PARTICIPANT_URL | Participant portal URL | Vercel | Notifications |
| Resend | RESEND_API_KEY | Email sending | Resend Dashboard | `apps/admin/lib/notifications` |
| Resend | RESEND_FROM_EMAIL | Sender address | Resend Dashboard | Email templates |
| Twilio | TWILIO_ACCOUNT_SID | SMS account | Twilio Console | `apps/admin/lib/notifications` |
| Twilio | TWILIO_AUTH_TOKEN | SMS auth token | Twilio Console | `apps/admin/lib/notifications` |
| Twilio | TWILIO_PHONE_NUMBER | SMS sender number | Twilio Console | `apps/admin/lib/notifications` |
| Xero | XERO_CLIENT_ID | Accounting integration | Xero Developer Portal | `apps/admin/lib/invoices` |
| Xero | XERO_CLIENT_SECRET | Accounting secret | Xero Developer Portal | `apps/admin/lib/invoices` |
| Expo | EXPO_PUSH_ACCESS_TOKEN | Mobile push notifications | Expo Dashboard | Worker Mobile App |
| Vercel | CRON_SECRET | Secure cron jobs | Vercel Dashboard | `apps/admin/app/api/cron` |

## Key Rotation Schedule

| Service | Last Rotated | Next Rotation | Rotated By |
|---------|-------------|---------------|------------|
| | | | |

## Environment Setup

```bash
# 1. Copy the template
cp .env.production.example .env.local

# 2. Fill in values from the sources above

# 3. For Vercel, set via dashboard or CLI:
vercel env add VARIABLE_NAME

# 4. Verify all keys are set:
# Check .env has no empty values
grep -E "^[A-Z].*=$" .env.local  # Shows any empty keys
```

## Security Rules

1. Never commit `.env` files to Git (`.gitignore` handles this)
2. Use different keys for dev/staging/production
3. Rotate keys immediately if exposed
4. Use server-only env vars for sensitive keys (no `NEXT_PUBLIC_` prefix)
5. Revoke unused keys promptly

---

<!-- Update this file whenever an API integration is added or removed. -->

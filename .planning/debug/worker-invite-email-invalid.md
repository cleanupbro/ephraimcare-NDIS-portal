---
status: resolved
trigger: "Worker creation fails with 'Email address is invalid' when using inviteUserByEmail; resend invite fails with 'A user with this email address has already been registered' when using generateLink"
created: 2026-01-24T00:00:00Z
updated: 2026-01-24T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two distinct root causes identified
test: N/A - investigation complete
expecting: N/A
next_action: Report findings

## Symptoms

expected: inviteUserByEmail sends invitation email successfully; resend-invite works for existing users
actual: inviteUserByEmail returns "Email address is invalid"; generateLink returns "A user with this email address has already been registered"
errors: "Email address is invalid", "A user with this email address has already been registered"
reproduction: Call POST /api/workers/invite with a valid email; Call resend-invite for existing user
started: Unknown

## Eliminated

- hypothesis: Email format is malformed or has whitespace
  evidence: The email passes basic truthy/string validation in the route. The form sends email directly from form data without known corruption. No trimming issue found.
  timestamp: 2026-01-24T00:00:30Z

- hypothesis: Service role key is wrong or missing
  evidence: SUPABASE_SERVICE_ROLE_KEY is present in .env.local, matches the project ref (vkjxqvfzhiglpqvlehsk), and has the correct 'service_role' claim in the JWT payload.
  timestamp: 2026-01-24T00:00:35Z

- hypothesis: Code logic error in how inviteUserByEmail is called
  evidence: The call signature in route.ts line 73-83 is correct per Supabase docs - passes email as first arg, options object with data and redirectTo as second arg.
  timestamp: 2026-01-24T00:00:40Z

## Evidence

- timestamp: 2026-01-24T00:00:10Z
  checked: .env.local configuration
  found: NEXT_PUBLIC_SITE_URL is NOT defined in .env.local. Only NEXT_PUBLIC_ADMIN_URL and NEXT_PUBLIC_PARTICIPANT_URL exist. This means redirectTo resolves to "undefined/auth/callback" but this is not the cause of the email validation error.
  implication: Minor issue (undefined redirect URL) but not the root cause of "Email address is invalid"

- timestamp: 2026-01-24T00:00:20Z
  checked: Supabase project SMTP configuration (via research)
  found: The hosted Supabase project (vkjxqvfzhiglpqvlehsk) uses the built-in email service. When using built-in SMTP, inviteUserByEmail is restricted to sending emails only to organization members (dashboard teammates). External emails will fail with misleading "Email address is invalid" error.
  implication: This is the root cause of Issue 1. The Supabase project needs a custom SMTP provider configured in the dashboard (Authentication > Emails > SMTP Settings).

- timestamp: 2026-01-24T00:00:25Z
  checked: Supabase generateLink with type 'invite' behavior for existing users
  found: generateLink with type 'invite' is designed ONLY for new users who have never been registered. If the user already exists in auth.users, it returns "A user with this email address has already been registered" by design. This is GoTrue/Supabase intentional behavior.
  implication: This is the root cause of Issue 2. The resend-invite route needs to use type 'magiclink' or 'recovery' for existing users, or check user existence first and branch accordingly.

- timestamp: 2026-01-24T00:00:45Z
  checked: supabase/config.toml auth settings
  found: Local dev has enable_confirmations = false and uses Inbucket (port 54324 implied). The issue is specifically with the HOSTED Supabase project which lacks custom SMTP.
  implication: Local dev may work fine (Inbucket captures emails), but hosted/production fails.

- timestamp: 2026-01-24T00:00:50Z
  checked: GitHub issues for supabase/auth
  found: Issue #1660 confirms inviteUserByEmail fails on certain hosted instances. Issue #2252 confirms the misleading "Email address is invalid" error. Multiple community reports confirm built-in SMTP restrictions cause this exact error.
  implication: Well-documented known issue. Fix is to configure custom SMTP.

## Resolution

root_cause: |
  TWO SEPARATE ROOT CAUSES:

  1. "Email address is invalid" from inviteUserByEmail:
     The hosted Supabase project (vkjxqvfzhiglpqvlehsk) does NOT have a custom SMTP provider configured.
     Supabase's built-in email service restricts sending to organization members only.
     When inviteUserByEmail tries to send to an external email address, Supabase returns
     the misleading error "Email address is invalid" instead of a more helpful
     "SMTP not configured" or "email delivery restricted" message.

  2. "A user with this email address has already been registered" from generateLink:
     The resend-invite route uses generateLink with type: 'invite'.
     This type is ONLY for new, never-registered users (by design in GoTrue/Supabase).
     For existing users who need a re-invite, the correct types are 'magiclink' or 'recovery'.

fix: |
  Issue 1 (SMTP - Supabase Dashboard Configuration):
    - Go to Supabase Dashboard > Authentication > Emails > SMTP Settings
    - Enable Custom SMTP and configure with a provider (Resend, SendGrid, Mailgun, etc.)
    - The .env.example already has RESEND_API_KEY placeholder, suggesting Resend was planned
    - Alternative: Use generateLink() to get the link and send via your own email service (Resend)

  Issue 2 (Code Fix - resend-invite/route.ts):
    - Check if user exists before choosing link type
    - For existing users: use type 'magiclink' instead of type 'invite'
    - This allows generating a valid authentication link for already-registered users

  Additional Fix (Minor - .env.local):
    - Add NEXT_PUBLIC_SITE_URL=http://localhost:3000 to .env.local
    - Currently undefined, which means redirectTo resolves to "undefined/auth/callback"

verification: Pending implementation
files_changed:
  - apps/admin/app/api/workers/resend-invite/route.ts (needs code change)
  - apps/admin/app/api/workers/invite/route.ts (needs SMTP config OR switch to generateLink + Resend)
  - .env.local (needs NEXT_PUBLIC_SITE_URL added)
  - Supabase Dashboard (needs custom SMTP configured)

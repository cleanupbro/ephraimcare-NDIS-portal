# EphraimCare NDIS Portal - QA Audit Findings

## 1. AUTH UX

| Issue | Description | Severity | Impact |
|-------|-------------|----------|--------|
| **Missing Auth Callback (Participant)** | The participant app has NO `/auth/callback` route. Magic links are configured to redirect to this non-existent path, causing login to fail with a 404. | **CRITICAL** | Users cannot log in via magic links. |
| **Broken Password Reset (Admin)** | The password reset flow redirects to `/reset-password?mode=update` after clicking the email link, but the page does not handle this mode. It just shows the "Request Reset" form again. | **CRITICAL** | Admins cannot actually change their password after receiving the reset email. |
| **SPA Navigation Failure** | Admin sidebar uses standard `<a>` tags instead of Next.js `<Link>` components. | **MAJOR** | Causes full page reloads on every navigation, breaking the SPA experience and increasing server load. |
| **Logout Redirect Risk** | Logout server action uses `redirect('/login')` after `signOut`. While common, Next.js can sometimes throw `NEXT_REDIRECT` errors if not handled inside a try/catch or specific lifecycle. | **MINOR** | Potential intermittent crashes during logout. |

## 2. SHIFT UX

| Issue | Description | Severity | Impact |
|-------|-------------|----------|--------|
| **Timezone Bug in Edit** | `shift-detail-sheet.tsx` constructs `new Date()` using local time strings without timezone offsets. | **MAJOR** | Shifts may be saved with incorrect times if the administrator's browser is in a different timezone than Sydney (AEST/AEDT). |
| **Form Logic Duplication** | `shift-detail-sheet.tsx` re-implements the entire shift form logic instead of reusing `shift-form.tsx`. | **MINOR** | High maintenance burden; bug fixes in one form won't reflect in the other. |
| **Dashboard Link Target** | "Schedule a shift" on the dashboard goes to `/shifts` (list) instead of `/shifts/new` (form). | **MINOR** | Extra click required for a "Quick Action". |
| **Cancellation Flow** | Cancellation dialog closes the entire detail sheet immediately. | **MINOR** | User loses context of the shift they just cancelled. |

## 3. WORKER UX

| Issue | Description | Severity | Impact |
|-------|-------------|----------|--------|
| **Resend Invite Logic** | "Resend Invite" button only appears if `worker.is_active` is true. | **MAJOR** | Counter-intuitive. If a worker hasn't joined yet, they might be marked as inactive, preventing admins from resending the invite. |
| **Missing Information** | Worker list (DataTable) lacks a Phone Number column, requiring a click into the detail page. | **MINOR** | Slower workflow for coordinators trying to contact staff. |
| **Hardcoded Data** | "Hours This Week" column in the worker list is hardcoded to `&mdash;`. | **MINOR** | Feature appears broken or unfinished to users. |

## 4. ADMIN DASHBOARD

| Issue | Description | Severity | Impact |
|-------|-------------|----------|--------|
| **Incomplete Quick Actions** | Only 3 actions available. Links go to index pages instead of creation forms. | **MINOR** | Limited utility for power users. |
| **Lack of Transparency** | No "Recent Activity" feed to see what other coordinators have done. | **MINOR** | Harder to track changes in a multi-admin environment. |
| **Type Safety** | `ComplianceWidget` uses `as any` for worker data, bypassing TypeScript safety. | **MINOR** | Potential for runtime errors if the Supabase schema changes. |

## 5. PARTICIPANT PORTAL

| Issue | Description | Severity | Impact |
|-------|-------------|----------|--------|
| **Hard Logout** | `Sidebar` uses `window.location.href = '/login'` instead of Next.js router. | **MINOR** | Harsh transition for users; clears browser state unnecessarily. |
| **Role Enforcement** | Redirects to `/unauthorized` if participant record is missing, but provides no "Next Steps". | **MINOR** | Users are left stranded if their profile wasn't fully set up by an admin. |
| **Missing Auth Routes** | (Same as Auth section) No `/auth/callback` route. | **CRITICAL** | Portal is essentially unusable for users without a password. |

---
**Auditor:** Gemini CLI
**Date:** 2026-03-07

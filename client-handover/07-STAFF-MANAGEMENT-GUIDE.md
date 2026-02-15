# Staff (Worker) Management — Complete Guide

This document explains everything about how workers (support staff) are managed in the Ephraim Care Portal — from adding them to managing their day-to-day.

---

## Quick Overview

| What | How |
|------|-----|
| Add a new worker | Admin Portal > Workers > Add Worker |
| Worker receives access | Welcome email with magic link |
| Resend the invite email | Worker detail page > "Resend Invite" button |
| View all workers | Admin Portal > Workers |
| Edit worker details | Worker detail page > "Edit" button |
| Track compliance | Worker detail page + Compliance Dashboard |
| Assign to shifts | Shifts > New Shift > select worker |

---

## Step-by-Step: Adding a New Worker

### 1. Go to Workers > Add Worker

In the Admin Portal sidebar, click **Workers**, then click the **"Add Worker"** button.

### 2. Fill in Basic Information (Required)

| Field | Required? | Example |
|-------|-----------|---------|
| First Name | Yes | Sarah |
| Last Name | Yes | Williams |
| Email | Yes | sarah.w@ephraimcare.com.au |
| Phone | No | 0412 345 678 |

The email address is important — this is where the invitation will be sent, and this is what they'll use to log in.

### 3. Select Support Types (Required)

Choose at least one support type the worker is qualified to provide:

- Personal Care
- Community Access
- Domestic Assistance
- Transport
- Capacity Building
- Respite Care

You can select multiple types. These are used when scheduling shifts — only workers with matching support types will be available for certain shift types.

### 4. Add Qualifications (Optional)

Enter qualifications one per line, such as:
- Certificate III in Individual Support
- Certificate IV in Disability
- Mental Health First Aid

### 5. Set Pay Details (Optional)

| Field | Default | Notes |
|-------|---------|-------|
| Hourly Rate ($) | Not set | Used in invoice calculations |
| Max Hours / Week | 38 | Helps prevent over-scheduling |

### 6. Add Compliance Checks (Optional — can be added later)

| Field | Purpose |
|-------|---------|
| NDIS Worker Screening Check Number | NDIS mandatory check |
| NDIS Check Expiry Date | System warns you 90 days before expiry |
| WWCC Number | Working With Children Check |
| WWCC Expiry Date | System warns you 90 days before expiry |

These compliance checks can be entered later by editing the worker. The system tracks expiry dates and will block scheduling shifts for workers with expired checks.

### 7. Click "Create Worker"

When you click the button, the system does all of the following automatically:

1. **Creates a user account** for the worker in the system
2. **Creates their profile** (name, email, phone, organisation)
3. **Creates their worker record** (support types, qualifications, compliance)
4. **Generates a magic login link** for the worker
5. **Sends a welcome email** to the worker's email address

You'll see a success message: **"Worker invited — An invitation email has been sent to the worker."**

You are then redirected back to the Workers list where the new worker now appears.

---

## What the Worker Receives

After you add a worker, they receive an email like this:

> **Subject:** Welcome to Ephraim Care - Set Up Your Account
>
> Welcome to Ephraim Care, Sarah!
>
> You've been invited as a support worker. Click the link below to access your account:
>
> **[Access My Account]** (green button)

When the worker clicks the link, they're logged into the system automatically through the magic link — no password needed.

### Important Note About the Welcome Email

The welcome email is sent through **Resend** (the email service). Currently, the sender address is configured via the `RESEND_FROM_EMAIL` environment variable on Vercel. If a worker reports they didn't receive the email:

1. Check their spam/junk folder
2. Use the **"Resend Invite"** button on their worker detail page
3. If emails consistently fail, check the Resend dashboard for delivery issues

---

## Resending an Invite

If a worker didn't receive their email or the link expired:

1. Go to **Workers** in the sidebar
2. Click on the worker's name to open their detail page
3. Click the **"Resend Invite"** button (envelope icon)
4. A new magic link email is sent to their registered email address

---

## Viewing Worker Details

Click any worker in the Workers list to see their full profile:

- **Header:** Full name, employee ID (if set), active/inactive status
- **Stats:** Shift statistics for the worker
- **Profile Information:** Email, phone, hourly rate, max hours per week
- **Support Types:** All the support types they provide (shown as badges)
- **Qualifications:** Listed qualifications
- **Compliance:** NDIS check and WWCC numbers with expiry dates

---

## Editing a Worker

1. Open the worker's detail page
2. Click the **"Edit"** button (pencil icon)
3. Update any fields needed
4. Click **Save**

You can update:
- Name, email, phone
- Support types
- Qualifications
- Hourly rate and max hours
- Compliance check numbers and expiry dates

---

## Worker Status (Active / Inactive)

Workers can be either **Active** or **Inactive**:

- **Active** — shown in the workers list, available for shift scheduling
- **Inactive** — hidden from shift scheduling, still visible in the workers list with an "Inactive" badge

To deactivate a worker, edit their profile and change their status. This does **not** delete their account or data — it just prevents them from being assigned to new shifts.

---

## Workers and Shifts

When creating a new shift:

1. Go to **Shifts** > **New Shift**
2. Select a participant
3. Select a worker from the dropdown
4. Only **active** workers with matching support types appear
5. The system checks for **scheduling conflicts** — if a worker is already booked at that time, you'll see a warning
6. Workers with **expired compliance checks** are blocked from being assigned

### Shift Status from the Worker's Perspective

| Status | What It Means |
|--------|--------------|
| Pending | Shift created but not yet confirmed |
| Scheduled | Confirmed and on the calendar |
| In Progress | Worker has clocked in (via mobile app) |
| Completed | Worker has clocked out |
| Cancelled | Shift was cancelled |

---

## Workers and the Mobile App

Support workers can use the **Worker Mobile App** (Expo Go) to:

- View their scheduled shifts
- Clock in with GPS at the participant's location
- Clock out and record the shift completion
- Write case notes after each shift
- View their shift history

### Setting Up a Worker on the Mobile App

1. Install **Expo Go** on the worker's phone (available on App Store and Google Play)
2. Open the Expo Go app
3. Scan the QR code or enter the project URL (provided by OpBros)
4. The worker logs in with their email address
5. They can use magic link login (same as the invite email) or password if one has been set

---

## Workers and Invoicing

Worker shifts feed directly into the invoicing system:

1. A shift is scheduled and assigned to a worker
2. The worker clocks in and out (actual times recorded)
3. When you generate an invoice, the system uses:
   - The worker's **hourly rate**
   - The **day type** (weekday, Saturday, Sunday, public holiday — different rates)
   - The **"lesser of" rule** — bills the shorter of scheduled vs actual time
4. Invoice amounts are calculated automatically

---

## Workers and Compliance

The **Compliance Dashboard** (sidebar > Compliance) tracks:

| Check | What It Is | Consequence When Expired |
|-------|-----------|------------------------|
| NDIS Worker Screening | Mandatory background check for NDIS workers | Worker blocked from shifts |
| Working With Children Check (WWCC) | Required if working with participants under 18 | Worker blocked from shifts |
| First Aid Certificate | First aid training certification | Warning flag raised |
| Police Check | Criminal history check | Warning flag raised |

### How Expiry Tracking Works

- The system warns you **90 days before** any check expires
- The Compliance Dashboard shows a colour-coded score:
  - **Green (80%+):** All checks up to date
  - **Amber (60-79%):** Some checks expiring soon
  - **Red (below 60%):** Urgent — checks expired
- Workers with expired mandatory checks (NDIS, WWCC) are automatically **blocked from being scheduled** until updated

---

## Workers and Case Notes

After completing a shift, workers document what happened:

- Workers write case notes through the mobile app or admin portal
- Notes can be flagged as a **concern** if there's an issue
- Workers have a **24-hour edit window** — after that, notes are locked and cannot be changed
- Admins can view all case notes across all workers in the **Case Notes** section

---

## Sample Workers (Pre-loaded for Testing)

| Worker | Email | Support Types |
|--------|-------|--------------|
| James Wilson | james@ephraimcare.com.au | Personal Care, Community Access |
| Emma Thompson | emma@ephraimcare.com.au | Personal Care, Capacity Building |
| Maria Garcia | maria@ephraimcare.com.au | Personal Care, Domestic Assistance |
| Liam Patel | liam@ephraimcare.com.au | Domestic Assistance, Community Access |
| David Chen | david@ephraimcare.com.au | Community Access, Transport |

All sample workers use the password: **EphraimWorker2026**

---

## Common Questions

### Can a worker log in to the Admin Portal?
No. Workers can only access the system through the Worker Mobile App. The Admin Portal requires an admin or coordinator role.

### Can I see a worker's shift history?
Yes. Open the worker's detail page — their stats and shift history are displayed.

### Can I remove a worker completely?
You can make them **Inactive** in the portal, which hides them from scheduling. To fully delete their account, use the Supabase dashboard (see `04-PASSWORD-MANAGEMENT.md`).

### What if a worker's email is wrong?
Edit the worker's profile and update the email. Then click "Resend Invite" so they receive a new magic link at the correct email.

### Can workers see other workers?
No. Workers can only see their own shifts and case notes through the mobile app.

### How many workers can I add?
There's no limit built into the system. The free tier of Supabase supports thousands of users.

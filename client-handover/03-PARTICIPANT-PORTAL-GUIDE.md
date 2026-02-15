# Participant Portal — Guide for Participants & Families

**URL:** https://ephraimcare-participant-portal.vercel.app

This portal is for NDIS participants and their families. It gives them a clear view of their support services, appointments, invoices, and budget.

---

## How to Log In

1. Go to https://ephraimcare-participant-portal.vercel.app
2. Enter your email address and password
3. Click **"Sign In"**

If you've forgotten your password, click **"Forgot your password?"** on the login page (see `04-PASSWORD-MANAGEMENT.md` for more details on how this works).

---

## Dashboard

After logging in, participants see their Dashboard with:

- **Welcome message** with their name
- **NDIS Number** displayed in the sidebar
- **Budget Status** — how much of their plan budget has been used (if a plan is assigned)
- **Plan Period** — when their current NDIS plan starts and ends
- **Upcoming Appointments** — their next scheduled support sessions

> Note: If a participant has no NDIS plan assigned yet, the dashboard will show "No budget information" and "No active plan" — this is normal and will update once you create a plan for them in the Admin Portal.

---

## Appointments

**Sidebar: Appointments**

Participants can:
- View all their upcoming support sessions
- See the date, time, worker, and support type for each appointment
- Request a cancellation if they need to cancel an appointment

When a participant requests a cancellation, it appears in the Admin Portal under **Cancellation Requests** for you to approve or deny.

---

## Invoices

**Sidebar: Invoices**

Participants can:
- View all invoices generated for their support services
- See the invoice number, amount, date, and status
- This is read-only — they can view but not modify invoices

> Invoices only appear here after you generate and finalise them in the Admin Portal.

---

## Profile

**Sidebar: Profile**

Participants can view their personal information:
- Full name
- NDIS number
- Date of birth
- Email address
- Phone number
- Address
- Emergency contact details
- Any additional notes

> Profile information is read-only. To update a participant's details, make changes in the Admin Portal.

---

## Signing Out

Click **"Sign Out"** at the bottom of the sidebar to log out securely.

---

## Giving Participants Access

To give a new participant access to this portal:

1. Create them as a participant in the **Admin Portal**
2. Make sure their email address is set correctly
3. They'll be able to log in at the Participant Portal URL with their email and the password you set for them

> You can set up participant accounts through the Supabase dashboard — see `04-PASSWORD-MANAGEMENT.md` for details.

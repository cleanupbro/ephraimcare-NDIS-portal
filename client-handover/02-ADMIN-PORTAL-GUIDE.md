# Admin Portal — Complete Guide

**URL:** https://ephraimcare-ndis-portal-admin.vercel.app
**Login:** admin@ephraimcare.com.au / EphraimAdmin2026

This is your main business management tool. Everything you need to run your NDIS service is here.

---

## Dashboard (Home Screen)

When you log in, you'll see the Dashboard. It shows:

- **Total Participants** — how many NDIS participants you're supporting
- **Total Workers** — how many support workers are registered
- **Today's Shifts** — shifts scheduled for today
- **Pending Invoices** — invoices waiting to be sent

Use the **sidebar menu** on the left to navigate to any section.

---

## Managing Participants

**Sidebar: Participants**

This is where you manage all your NDIS participants (clients).

### Viewing Participants
- The list shows all participants with their name, NDIS number, and status
- Click on any participant to see their full profile
- Use the search bar to find participants by name or NDIS number
- Filter by Active or Archived status

### Adding a New Participant
1. Click the **"Add Participant"** button
2. Follow the 4-step wizard:
   - **Step 1:** Basic info (name, date of birth, NDIS number)
   - **Step 2:** Contact details (email, phone, address)
   - **Step 3:** Emergency contact
   - **Step 4:** Additional notes
3. Click **Save** to create the participant

### Participant Profile
Click on any participant to see:
- Personal details and NDIS number
- Contact information
- Emergency contact
- Their NDIS plan and budget (if assigned)
- Shift history
- Invoices

---

## Managing Workers

**Sidebar: Workers**

This is where you manage your support workers.

### Viewing Workers
- The list shows all workers with their name, email, support types, and status
- Click on any worker to see their full profile

### Adding a New Worker
1. Click **"Add Worker"**
2. Fill in their details: name, email, phone, support types, hourly rate
3. Click **Save**
4. The worker receives an email invite to set up their account

### Worker Profile
Each worker profile shows:
- Contact details
- Support types they provide (Personal Care, Community Access, Transport, etc.)
- Compliance status (NDIS Worker Check, WWCC, First Aid)
- Shift history

---

## Scheduling Shifts

**Sidebar: Shifts**

This is where you schedule and manage support shifts.

### List View
- Shows all shifts for the current week
- Each shift displays: participant, worker, date, time, support type, status
- Filter by participant, worker, status, or support type

### Calendar View
- Click the **"Calendar"** button to switch to calendar view
- See shifts laid out on a weekly or monthly calendar
- Visual overview of your schedule

### Creating a New Shift
1. Click **"New Shift"**
2. Select a **participant** (who receives the support)
3. Select a **worker** (who provides the support)
4. Choose the **date and time**
5. Select the **support type**
6. Click **Save**

### Recurring Shifts
- When creating a shift, you can set it to repeat weekly
- Great for regular ongoing support arrangements

### Shift Status
Shifts move through these stages:
- **Pending** — created but not yet confirmed
- **Scheduled** — confirmed and on the calendar
- **In Progress** — worker has clocked in
- **Completed** — shift finished, worker clocked out
- **Cancelled** — shift was cancelled

---

## NDIS Plans & Budget Tracking

**Sidebar: NDIS Plans**

This is where you manage each participant's NDIS plan and track their budget.

### Viewing Plans
- See all active plans with participant name, plan number, and budget
- Click on a plan to see the full budget breakdown

### Plan Details
Each plan shows:
- **Plan Number** (e.g., PLAN-2026-001)
- **Plan Period** — start and end dates
- **Budget Categories:**
  - Core Supports (daily activities + community participation)
  - Capacity Building
  - Capital
- **Spending** — how much has been used vs. total budget

---

## Invoicing & Billing

**Sidebar: Invoices**

This is where you generate and manage invoices for NDIS claims.

### Viewing Invoices
- List of all invoices with number, participant, amount, and status
- Click on any invoice to see the full detail

### Generating an Invoice
1. Click **"Generate Invoice"**
2. Select the participant
3. Select the shifts to include
4. The system automatically calculates:
   - Hourly rates based on day type (weekday, Saturday, Sunday, public holiday)
   - The "lesser of" rule (bills the shorter of scheduled vs actual time)
   - 10% GST
5. Review and save

### Invoice Status
Invoices move through these stages:
- **Draft** — created but not finalised
- **Pending** — ready to send
- **Submitted** — sent for payment
- **Paid** — payment received
- **Overdue** — past due date

### Downloading & Exporting
- **PDF Download** — generate a professional PDF invoice
- **PACE CSV Export** — creates an NDIA-format file for bulk claiming through the NDIA portal

---

## Case Notes

**Sidebar: Case Notes**

Case notes document what happened during each shift.

- Workers write case notes after each shift
- Notes can be flagged as a concern if there's an issue
- Workers have a 24-hour edit window — after that, notes are locked
- You can view all case notes across the organisation

---

## Incident Reporting

**Sidebar: Incidents**

Report and track incidents that occur during support delivery.

- Each incident records: type, severity (low/medium/high/critical), description
- The NDIA requires certain incidents to be reported within 5 days — the system tracks this deadline
- Filter incidents by status, severity, or type
- Track whether each incident has been resolved

---

## Compliance Dashboard

**Sidebar: Compliance**

Monitor your organisation's compliance status at a glance.

### Compliance Score
Your organisation gets an overall compliance score based on:
- **Worker Compliance (40%)** — are all worker checks up to date?
- **Incident Resolution (30%)** — are incidents being resolved on time?
- **Documentation (30%)** — are case notes and records complete?

Scores are colour-coded: Green (80%+), Amber (60-79%), Red (below 60%)

### Worker Screening
Track each worker's screening documents:
- NDIS Worker Screening Check
- Working With Children Check (WWCC)
- First Aid Certificate
- Police Check

The system warns you **90 days before** any check expires, and blocks scheduling shifts for workers with expired checks.

---

## Cancellation Requests

**Sidebar: Cancellation Requests**

When participants request to cancel an appointment through their portal, it appears here.

- Review each cancellation request
- Approve or deny the request
- View the reason for cancellation

---

## Settings

**Sidebar: Settings**

View and manage your account:
- Your name, email, and role
- Organisation ID
- Change Password button (see `04-PASSWORD-MANAGEMENT.md` for details)
- Sign Out

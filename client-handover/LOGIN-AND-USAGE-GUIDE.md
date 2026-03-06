# Ephraim Care Portal — Login & Usage Guide

This document provides the necessary live URLs, login credentials, and brief instructions on how to access and test the different portals in the Ephraim Care ecosystem.

## 🔗 Live URLs

| Portal | URL | Access Level |
|--------|-----|--------------|
| **Admin Portal** | [https://ephraimcare-ndis-portal-admin.vercel.app](https://ephraimcare-ndis-portal-admin.vercel.app) | Admin, Coordinator |
| **Participant Portal** | [https://ephraimcare-participant-portal.vercel.app](https://ephraimcare-participant-portal.vercel.app) | Participant (Client) |
| **Worker Mobile App** | Provided via Expo Go (Mobile Only) | Support Worker |

---

## 🔐 Test Login Credentials

Use the following test accounts to log into the respective portals. **Make sure you are on the correct portal for the role you are testing.**

### 1. Administrator (Admin Portal)
- **Email:** `admin@ephraimcare.com.au`
- **Password:** `EphraimAdmin2026`
- **What it does:** Full system access. Used to manage all participants, workers, shifts, compliance scores, invoices, case notes, and system settings.

### 2. Coordinator (Admin Portal)
- **Email:** `sarah@ephraimcare.com.au`
- **Password:** `EphraimCoord2026`
- **What it does:** Used to schedule shifts, handle daily operations, and manage support workers without full system administration rights.

### 3. Participant / Client (Participant Portal)
- **Email:** `client@ephraimcare.com.au`
- **Password:** `EphraimClient2026`
- **What it does:** Used by NDIS participants to view their personal schedule (Appointments), check their available budget, view past invoices, read their case notes, and request shift cancellations.

### 4. Support Worker (Worker Mobile App)
- **Email:** `james@ephraimcare.com.au`
- **Password:** `EphraimWorker2026`
- **What it does:** Used by staff to view upcoming shifts, clock in and out (with GPS verification), and submit incident reports or shift notes.

---

## 📝 How to Test the Primary Workflows

If you want to manually test the portals, follow these common operational flows:

### Shift Creation & Assignment
1. Log into the **Admin Portal** as the Administrator.
2. Navigate to **Shifts** and click **New Shift**.
3. Asssign the shift to a worker (e.g., James) and a participant (e.g., Client).
4. Save the shift.

### Participant Viewing Shifts
1. Open a new browser tab and log into the **Participant Portal** as the Client.
2. Navigate to **Appointments**.
3. You will see the shift that was just created by the Admin.

### Processing a Cancellation
1. In the **Participant Portal**, find an upcoming appointment and click **Request Cancellation**.
2. Return to the **Admin Portal** tab.
3. Navigate to **Cancellations** (or Cancellation Requests) in the sidebar.
4. You will see the participant's request and can click **Approve** or **Reject**.

### Compliance & Incidents
1. In the **Admin Portal**, navigate to the **Compliance** dashboard to see the real-time health score of workers and documentation.
2. Navigate to **Incidents** to log or view any reported incidents.

*Note: These are test credentials pre-populated in the database for demonstration and handover purposes.*

---

## 📂 Additional Handover Documents

For more depth on the system architecture and project history, please refer to these documents within this folder:

- **[Delivery Summary](./DELIVERY-SUMMARY.md)**: A complete list of all pages and features in each app, along with the required third-party services (Supabase, Resend, Twilio, etc.).
- **[Technical Handoff](./TECHNICAL-HANDOFF.md)**: A developer-focused guide covering security status, known bugs, and the upgrade path for future features.
- **[Project Audit Log](./PROJECT-AUDIT-LOG.md)**: A historical timeline showing the major milestones and fixes completed during the build.
- **[Comprehensive Testing Report](./COMPREHENSIVE-TESTING-REPORT.md)**: Detailed technical results from our performance and logic stress tests.
- **[Brain Architecture](./BRAIN-ARCHITECTURE.md)**: A deep-dive into the technical design and "brain" of the NDIS management logic.
- **[Photo Gallery](./HANDOVER.md)**: A collection of screenshots for every single page in the platform.

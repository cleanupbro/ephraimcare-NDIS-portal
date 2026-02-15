# Worker Mobile App — Setup & Usage Guide

The Worker Mobile App is for support workers to manage their shifts from their phone. It runs through **Expo Go** (a free app) — no App Store download needed for testing.

---

## Quick Summary

| What | Details |
|------|---------|
| App Name | Ephraim Care Worker |
| Platform | iOS and Android |
| How to Access | Expo Go app (free) |
| Login | Worker email + password |
| Key Features | View shifts, GPS clock in/out, case notes, weekly schedule |

---

## How a Worker Sets Up the App

### Step 1: Install Expo Go

The worker downloads **Expo Go** from their phone's app store:
- **iPhone:** Search "Expo Go" in the App Store
- **Android:** Search "Expo Go" in Google Play Store

Expo Go is free and made by Expo — it's a trusted app used by developers to preview mobile apps.

### Step 2: Get the Project Link

You (the admin) provide the worker with the Expo project link or QR code. This is generated when you run the development server:

```
cd apps/worker-mobile
npx expo start
```

This displays a QR code in the terminal. The worker scans this QR code with:
- **iPhone:** The built-in Camera app (it recognises Expo QR codes)
- **Android:** The Expo Go app's built-in scanner

> **Note for production:** To share the app without running a dev server, you would publish it using EAS (Expo Application Services) or submit it to the App Store / Google Play. This hasn't been done yet — currently the app is in testing mode via Expo Go.

### Step 3: Log In

When the app opens, the worker sees the Ephraim Care login screen:

1. Enter their **email** (the same one used when you added them in the Admin Portal)
2. Enter their **password**
3. Tap **Sign In**

The worker's password is set when they're invited. For existing test workers, the password is `EphraimWorker2026`.

### Step 4: Allow Location Access

On first use, the app asks for **location permission**. The worker must tap **"Allow While Using App"** — this is required for GPS clock-in to work.

The app uses location to:
- Verify the worker is at the participant's address when clocking in
- Record GPS coordinates for accountability
- The worker must be within **500 metres** of the participant's address to check in

---

## What the Worker Sees — App Screens

The app has 4 tabs at the bottom:

### Tab 1: Home

Shows today's shifts:
- Date (e.g., "Today, Monday 16 Feb")
- Each shift card shows: participant name, time, support type, status
- Tap a shift card to open the shift detail
- If no shifts today: shows "No shifts today" with the next upcoming shift

### Tab 2: Schedule

Weekly calendar view:
- Navigate between weeks with left/right arrows
- Shows the week range (e.g., "16 Feb – 22 Feb 2026")
- Each day shows scheduled shifts
- Tap any shift to see details

### Tab 3: My Notes

Case notes management:
- Shows shifts that need case notes written (within 24-hour window)
- Each card shows: participant name, shift time, duration, time remaining to write
- Red timer shows how much time is left in the 24-hour edit window
- Tap "Write Note" to open the note editor
- When all notes are done: shows "All caught up!" with a green checkmark
- Badge on the tab icon shows count of pending notes

### Tab 4: Profile

Worker's profile:
- Name and email
- Role: Worker
- Pending sync indicator (if actions were saved offline)
- **Log Out** button
- "Powered by OpBros" footer

---

## How Clock In / Clock Out Works

This is the core feature — GPS-verified shift attendance.

### Clock In

1. Worker opens the **Home** tab and taps their shift
2. The shift detail page shows:
   - Participant name
   - Shift time (e.g., "9:00 AM – 12:00 PM")
   - Support type and date
   - Participant's address
   - Medical alerts (if any are in the participant's notes)
3. Worker taps the green **"Check In"** button
4. The app:
   - Requests GPS location
   - Checks if the worker is within **500 metres** of the participant's address
   - If within range: records check-in time + GPS coordinates, shift status changes to "In Progress"
   - If too far: shows error "You are Xm away. Must be within 500m to check in."
5. A **live timer** appears at the top of the app showing elapsed time

### During the Shift

- The timer bar stays visible across all tabs
- Shows: participant name + elapsed time (e.g., "Alice J. — 1h 23m")
- Worker can continue using other tabs (Schedule, Notes, Profile)

### Clock Out

1. Worker returns to the shift detail page
2. Taps the blue **"Check Out"** button
3. The app:
   - Records check-out time + GPS coordinates
   - Calculates duration (e.g., "Duration: 2h 45m")
   - Updates shift status to "Completed"
4. A **Case Note prompt** appears: "Would you like to add a case note?"
   - **Write Note** — opens the note editor
   - **Skip** — dismisses (but the note can be written later from the Notes tab)

### Offline Support

If the worker loses internet during a shift:
- Check-in/out is saved locally
- A "pending sync" indicator appears on the Profile tab
- Actions sync automatically when connection returns

---

## How Case Notes Work

After completing a shift, workers document what happened:

### Writing a Note

1. The case note modal appears after check-out (or from the Notes tab)
2. Worker writes the note (minimum 10 characters)
3. Character counter shows progress: "45/10 min"
4. Optional: toggle **"Flag a concern"** switch
   - If flagged, a separate "Concern description" field appears
   - Concerns are highlighted for admin review
5. Tap **"Save Note"** to submit

### 24-Hour Edit Window

- Notes must be written within **24 hours** of shift completion
- The Notes tab shows a red countdown timer for each pending note
- After 24 hours, the note can no longer be created or edited
- This ensures notes are written while the shift is still fresh

### What Gets Recorded

Each case note includes:
- Shift ID (links to the specific shift)
- Participant name
- Note content (free text)
- Concern flag (yes/no)
- Concern description (if flagged)
- Duration of the shift
- Timestamp

---

## GPS Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| Check-in radius | 500 metres | Worker must be this close to the participant |
| GPS timeout | 5 seconds | How long the app waits for a GPS fix |
| GPS accuracy | 100 metres max | Minimum accuracy required |
| Auto-checkout warning | 20 minutes | Warns worker if approaching auto-checkout |
| Auto-checkout | 30 minutes | Auto checks out after 30min of inactivity |

---

## App Permissions

The app requests these permissions on the worker's phone:

| Permission | Why | Required? |
|-----------|-----|-----------|
| Location (While Using) | GPS check-in verification | Yes — app won't work without it |
| Notifications | Shift reminders and alerts | Recommended but optional |

---

## Test Worker Accounts

Use these to test the mobile app:

| Worker | Email | Password |
|--------|-------|----------|
| James Wilson | james@ephraimcare.com.au | EphraimWorker2026 |
| Emma Thompson | emma@ephraimcare.com.au | EphraimWorker2026 |
| Maria Garcia | maria@ephraimcare.com.au | EphraimWorker2026 |
| Liam Patel | liam@ephraimcare.com.au | EphraimWorker2026 |
| David Chen | david@ephraimcare.com.au | EphraimWorker2026 |

---

## Important Notes

### Workers CANNOT access the web portals
- **Admin Portal:** Workers are blocked — shows "Access Denied: You do not have permission to access the admin portal"
- **Participant Portal:** Workers are blocked — shows "Access Denied: This portal is for NDIS participants only"
- Workers can **only** access the system through the mobile app

### The app is currently in testing mode
- Workers use **Expo Go** to access the app
- The app has **not been published** to the App Store or Google Play yet
- To publish: requires an Apple Developer account ($99/year) and Google Play account ($25 one-time)
- Contact OpBros.ai if you want to publish the app

### What workers can see
- Only their own shifts (not other workers' shifts)
- Only their own case notes
- Participant names and addresses for their assigned shifts only
- No access to invoicing, billing, compliance, or other admin functions

### What workers can do
- View their schedule
- Clock in/out of shifts
- Write and edit case notes (within 24 hours)
- Log out

### What workers CANNOT do
- See other workers
- Access admin features
- Modify participant records
- View invoices or billing
- Change their own profile details

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Could not get your location" | Worker needs to enable Location Services in phone settings and allow the Ephraim Care app |
| "You are Xm away" | Worker must be within 500m of the participant's address. Check that the participant has GPS coordinates set in their profile |
| Check-in/out not syncing | Check internet connection. Pending actions sync automatically when online |
| Worker can't log in | Verify their email is correct in the Admin Portal. Try "Resend Invite" from their worker detail page |
| Expo Go won't scan QR | Make sure Expo Go is updated to the latest version |
| Case note won't save | Minimum 10 characters required. Check the character counter |

# Password Management — What Works & What Doesn't

This document answers common questions about managing passwords for the Ephraim Care Portal.

---

## Quick Summary

| Action | Available? | How |
|--------|-----------|-----|
| User changes own password | Not yet | Must be done via Supabase dashboard |
| User resets forgotten password | Partially | Reset email sends, but the link doesn't complete properly yet |
| Admin changes another user's password | No | Must be done via Supabase dashboard |
| Admin deletes a user account | No | Must be done via Supabase dashboard |

---

## Detailed Explanations

### Can users change their own password?

The Settings page in the Admin Portal has a **"Change Password"** button, but it is **not yet functional** — clicking it does nothing. This is a cosmetic button that was placed during development but the backend logic was not connected.

**For now:** To change a user's password, use the Supabase dashboard (see instructions below).

### Can users reset a forgotten password?

The login page has a **"Forgot your password?"** link. Clicking it takes the user to a reset page where they enter their email. The system **does send a reset email** successfully. However, when the user clicks the reset link in the email, they may see a "Page Not Found" error because the callback page hasn't been fully set up yet.

**For now:** If a user forgets their password, reset it for them through the Supabase dashboard (see instructions below).

### Can an admin change another user's password?

There is no UI in the portal to change other users' passwords. This must be done through the Supabase dashboard.

### Can users be deleted?

Workers and participants can be **archived** (hidden from active lists) in the portal, but the actual user account cannot be deleted from within the portal. To fully remove a user account, use the Supabase dashboard.

---

## How to Manage Passwords via Supabase Dashboard

The Supabase dashboard is where your database and user accounts are managed. Here's how to access it and manage passwords:

### Step 1: Log in to Supabase
1. Go to https://supabase.com/dashboard
2. Sign in with the account that owns the Ephraim Care project
3. Select the **Ephraim Care** project

### Step 2: Navigate to Users
1. In the left sidebar, click **Authentication**
2. Click **Users**
3. You'll see a list of all registered users with their email addresses

### Step 3: Change a User's Password
1. Find the user in the list
2. Click on their row to open their details
3. Click the three-dot menu or **"Update user"**
4. Enter the new password
5. Click **Save**
6. Let the user know their new password

### Step 4: Delete a User (if needed)
1. Find the user in the list
2. Click on their row
3. Click **"Delete user"**
4. Confirm the deletion

> **Important:** Deleting a user from Supabase removes their login permanently. Their data (shifts, invoices, case notes) will remain in the database, but they won't be able to log in anymore.

---

## Creating New User Accounts

When you add a new worker through the Admin Portal and send them an invite email, the system creates their account automatically.

For participants, you may need to create their login manually:

1. Go to the Supabase dashboard > **Authentication** > **Users**
2. Click **"Add user"**
3. Enter their email address and choose a password
4. Click **Create user**
5. Then create their participant profile in the Admin Portal with the same email address

---

## Future Improvements

These password features can be added in a future update:
- Working "Change Password" button in Settings
- Complete password reset flow (fixing the callback page)
- Admin ability to reset user passwords from within the portal
- User account management from the Admin Portal

Contact OpBros.ai (contact@opbros.online) if you'd like any of these features implemented.

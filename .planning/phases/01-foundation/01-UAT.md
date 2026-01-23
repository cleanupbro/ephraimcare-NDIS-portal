---
status: complete
phase: 01-foundation
source: ROADMAP.md Phase 1 Success Criteria + Requirements
started: 2026-01-24T02:04:00+11:00
updated: 2026-01-24T02:07:00+11:00
---

## Current Test

[testing complete]

## Tests

### 1. Admin Login and Dashboard
expected: Navigate to login, enter admin credentials, see dashboard with "Welcome back, Ephraim", Role: Admin, and correct data counts (5 participants, 5 workers)
result: pass

### 2. Sidebar Navigation
expected: All sidebar links (Dashboard, Participants, Workers, Shifts, NDIS Plans, Invoices, Case Notes, Settings) are visible and clickable. Bottom of sidebar shows "Ephraim Admin" with "Admin" role in green.
result: pass

### 3. Participants Page
expected: Shows "5 participants registered" with a table listing Alice Johnson, Bob Smith, Carol Williams, Daniel Brown, Eve Davis — each with NDIS numbers, phone numbers, Western Sydney locations, and green "Active" badges.
result: pass

### 4. Workers Page
expected: Shows "5 support workers" with table listing James Wilson, Maria Garcia, David Chen, Emma Thompson, Liam Patel — each with Employee IDs, qualifications (Cert III/IV), services, hourly rates ($42.50-$48.00/hr), and Active status.
result: pass

### 5. Shifts Page
expected: Shows "20 shifts total" with table listing shifts sorted by date (newest first). Each row shows participant name, worker name, scheduled date/time, duration (4-6h), and status (Scheduled in yellow, Completed in green).
result: pass

### 6. NDIS Plans Page
expected: Shows "2 plans" with two cards: Alice Johnson (PLAN-2026-001, $85,000 budget, Current badge) and Bob Smith (PLAN-2026-002, $62,000 budget, Current badge). Each card shows budget line items by category.
result: pass

### 7. Invoices Page
expected: Shows "2 invoices" with table: INV-202601-0001 (Alice Johnson, $340.00, Pending) and INV-202601-0002 (Bob Smith, $360.00, Draft). Date column shows 22/01/2026.
result: pass

### 8. Settings Page
expected: Shows Profile section with: First Name "Ephraim", Last Name "Admin", Email "admin@ephraimcare.com.au", Role "Admin", Phone "Not set", Organization ID (UUID). Security section with "Change Password" button. Danger Zone with red "Sign Out" button.
result: pass

### 9. OpBros Footer
expected: Dashboard page shows "Powered by OpBros" at the bottom. "OpBros" is a clickable link (should point to opbros.online). The link opens in a new tab.
result: pass

### 10. Failed Login Error
expected: Enter wrong password on login page. Shows clear error message "Invalid email or password. Please try again." without crashing.
result: pass

### 11. Branding Colors
expected: "Ephraim Care" header in green, role badges in green/teal, action buttons green, cards with rounded corners, login page title and button in green.
result: pass

### 12. RLS Data Isolation
expected: All pages show data — nothing returns 0 or empty (except Case Notes which has no seed data). Confirms RLS policies allow org-scoped access.
result: pass

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0

## Gaps

[none]

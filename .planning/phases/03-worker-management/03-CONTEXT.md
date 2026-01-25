# Phase 3: Worker Management - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

CRUD for worker profiles with qualifications, compliance dates, and worker auth. Admin creates and manages workers; workers receive invite emails and can log in. This phase delivers the worker entity layer that shift scheduling (Phase 4) depends on.

</domain>

<decisions>
## Implementation Decisions

### Worker profile structure
- Table rows on list page (consistent with participant list, not cards)
- List columns: Name, Email, Support Types, Status, Hours This Week
- Detail page stats: Hours this week, Hours this month, Next shift (three stat cards at top)
- Compliance section is separate from qualifications (checks only in compliance section)
- Qualifications shown in their own section on detail page

### Compliance date handling
- Dedicated compliance section on detail page (not inline with other profile fields)
- Shows NDIS Worker Check number + expiry and WWCC number + expiry
- Status badges: Valid (green), Expiring (amber), Expired (red)
- Traffic light dot on list page: green = all valid, amber = expiring within 90 days, red = expired
- Compliance checks are optional at worker creation (can be added later)

### Worker creation flow
- Compliance check fields (NDIS number, WWCC number, expiry dates) are optional at creation
- Support types and qualifications input style: Claude's discretion
- Form style (multi-step vs single page): Claude's discretion based on field count

### Welcome email and credentials
- Invite link flow (worker sets own password) — no temporary passwords in emails
- Email sent automatically on worker creation
- Admin can resend invite from worker detail page
- Invite link expires after 7 days
- Email content: informative — includes welcome, assigned support types, brief mobile app intro, and password setup link

### Claude's Discretion
- Support types visual treatment (tags vs list with icons)
- Support types input method during creation (checkboxes vs tag input)
- Qualifications capture approach (free-text vs predefined + custom)
- Form layout (multi-step vs single page)
- Compliance countdown display style (badge vs just date with color)
- Loading states and error handling

</decisions>

<specifics>
## Specific Ideas

- Table layout should match participant list for consistency (same DataTable component patterns)
- Compliance section visually distinct — clearly separated from general profile info
- Traffic light dot on list gives instant compliance health at a glance
- Welcome email should feel informative, not just a bare link — worker should understand what they're being invited to

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-worker-management*
*Context gathered: 2026-01-24*

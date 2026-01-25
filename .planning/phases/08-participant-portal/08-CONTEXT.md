# Phase 8: Participant Portal - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Read-only portal for participants to view their NDIS plan status, budget utilization, upcoming appointments, and download finalized invoices. No edit, create, or request capabilities in v1. Portal is purely informational.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout
- Budget status is the hero section — large progress bar front and center
- Two-column grid below hero: plan info on left, upcoming appointments on right
- Show next 3-5 appointments inline on dashboard (no separate page click required)
- Sidebar navigation matching admin portal pattern: Dashboard, Invoices, Profile

### Budget Visualization
- Display both dollars and percentage: "$4,500 of $15,000 used (30%)"
- Single total progress bar — no breakdown by support type
- Color thresholds: Green → Yellow (75% used) → Red (90% used)
- No spending projections or pace indicators in v1 — keep it simple

### Invoice Experience
- Simple table presentation: Invoice #, Date, Total amount, Download button
- Click invoice to preview line items in modal, then download from there
- No filtering — chronological list (participants typically have few invoices)

### Empty and Edge States
- No upcoming appointments: "No upcoming appointments scheduled"
- Expired plan: Red/orange banner alert at top with contact instruction
- Budget warning at 90%: Claude's discretion on visual treatment

### Claude's Discretion
- No invoices empty state design (friendly message vs illustration)
- Budget 90%+ warning visual treatment (red bar alone vs with text)
- Exact spacing, typography, and component styling

</decisions>

<specifics>
## Specific Ideas

- Sidebar nav should match admin portal for visual consistency across the product
- Budget is what participants care about most — make it prominent
- Keep everything read-only and simple — this is information display, not interaction

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-participant-portal*
*Context gathered: 2026-01-25*

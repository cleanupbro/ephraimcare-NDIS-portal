# Phase 7: Invoicing - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate invoices from completed shifts for individual participants. Billing uses lesser-of-scheduled-vs-actual hours, with tiered rates (weekday/weekend/holiday), GST at 10%, PDF export with branding, and NDIS bulk payment CSV in PACE-compliant format. Invoice lifecycle: draft to finalized (locked).

</domain>

<decisions>
## Implementation Decisions

### Invoice generation flow
- Per-participant generation only (no batch/bulk generation)
- Dedicated top-level "Invoices" page with participant selector and date range picker
- After generation: immediate full preview with approve/edit options before finalizing
- Block generation if no completed shifts in date range ("No billable shifts found" message, no empty invoices created)

### Line item display
- Chronological ordering (all shifts in date order, regardless of support type)
- Show only billable hours per line (not scheduled vs actual breakdown)
- Column selection: Claude's discretion based on NDIS invoice standards
- Invoice number: globally sequential INV-YYYY-NNN format (not per-participant)

### PDF branding & layout
- Header: Ephraim Care logo + ABN + full contact details
- Business details:
  - Ephraim Care Pty Ltd
  - ABN: 76 685 693 565
  - Phone: 0451 918 884
  - Email: info@ephraimcare.com.au
  - Address: Factory 1A, 9 Lyn Parade, Prestons NSW 2170
- Bill To section: Participant name + NDIS number (no address)
- Footer: "Powered by OpBros" credit only (no payment terms)
- Branding colors: Ephraim Care green (#66BB6A) and teal (#00BFA5)

### Rates & settings
- Tiered rate model: each support type has weekday, Saturday, Sunday, and public holiday rates
- Public holidays: admin manually marks specific dates as holidays in settings (no auto-detection)
- Rate editing: Admin role only
- Rate changes apply to future invoices only (existing drafts keep their original rates, not recalculated)

### Claude's Discretion
- Line item columns (appropriate for NDIS context)
- Invoice list page layout and filtering options
- Draft editing UX (inline edit vs form)
- PACE CSV field mapping details
- PDF typography and spacing
- Loading states and error handling

</decisions>

<specifics>
## Specific Ideas

- Invoice preview after generation should feel like reviewing a real invoice before sending (not a form)
- Rates page should be simple and scannable -- all support types visible at once with their tier rates
- PDF should look professional enough to submit directly to NDIS plan managers

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 07-invoicing*
*Context gathered: 2026-01-25*

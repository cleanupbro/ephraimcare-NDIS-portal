# Phase 9: Notifications - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Email notifications for three events: worker shift assignments, shift cancellations, and invoice finalizations. Workers, participants, and admin receive timely emails when these actions occur. No SMS, no push notifications, no in-app notifications — email only.

</domain>

<decisions>
## Implementation Decisions

### Email Content & Branding
- Clean minimal HTML style — simple layout with subtle Ephraim Care branding, fast to load
- Brief & direct tone — "New shift: [Date] [Time] at [Location]" style, not formal letters
- Include "View Shift" / "View Invoice" button linking to appropriate portal
- Sender: `Ephraim Care <noreply@ephraimcare.com.au>`

### Delivery Mechanism
- Use Resend as email service (modern API, simple setup)
- Fire-and-forget pattern — send and continue, don't wait for delivery confirmation
- No delivery tracking — no logs, no webhooks, just send
- Simple HTML template strings in the API route (no React Email package)

### Recipient Logic
- **Shift assignment:** Worker receives email, admin CC'd (`ephraimcare252@gmail.com`)
- **Shift cancellation:** Worker + participant both receive email, admin CC'd
- **Invoice finalized:** Participant receives email + emergency contact if on file (for families who manage finances)
- Admin CC email hardcoded for now — will update to official Ephraim Care admin email when available

### Timing & Triggers
- Send immediately when action completes (no delay, no batching)
- API route pattern — existing create/cancel/finalize routes call notification helper after DB success
- Shift emails include: date, time, participant name + "View details" link (not full address/notes)

### Claude's Discretion
- No opt-out for v1 — everyone receives notifications (simplest approach)
- Exact HTML template structure and styling
- Error handling if Resend call fails (silent failure acceptable for fire-and-forget)
- Email subject line wording

</decisions>

<specifics>
## Specific Ideas

- Keep emails scannable — workers check on phone, participants may have accessibility needs
- Button should be obvious and tappable on mobile
- Emergency contact CC for invoices helps families managing NDIS plans for participants

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-notifications*
*Context gathered: 2026-01-26*

# Phase 2: Participant Management - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can create, view, edit, and archive participants with full NDIS plan details and budget tracking. This delivers the participant entity that shifts and invoices will reference. No participant self-service, no shift creation, no invoicing — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### List view presentation
- Minimal info per row: name, NDIS number, status (active/archived)
- Click into participant for all other details
- Claude's discretion: table vs card layout, search/filter UI design, create button placement

### Multi-step form flow
- 4 steps as per requirements: basic info, plan details, contacts, support needs
- Stepper with clickable step indicators — can jump to any completed step
- Must validate current step before advancing
- No draft saving — must complete all required fields to create a participant
- Claude's discretion: validation timing (inline vs on-step-exit), post-creation destination

### Budget & plan display
- Budget utilization shown as horizontal progress bar with dollar amounts and percentage
- Traffic light thresholds: green under 70%, amber 70-90%, red above 90%
- Plan countdown shown as "X days remaining" badge
- Badge color: red when under 30 days, amber under 60 days
- Claude's discretion: detail page structure (tabs vs scrolling), section organization

### Archive behavior
- Type-to-confirm: admin must type participant's name to confirm archival
- No restore capability — once archived, stays archived
- Block archival if participant has upcoming/active shifts (must cancel or reassign first)
- Claude's discretion: how archived participants appear in filtered views

### Claude's Discretion
- List layout style (table vs cards)
- Search/filter UI implementation
- Create button placement and prominence
- Form validation timing
- Post-creation navigation destination
- Detail page structure (tabs vs sections)
- Archived participants visual treatment in list

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraint: this is an admin-facing CRUD tool for managing NDIS participants, so prioritize efficiency and data clarity over visual flair.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-participant-management*
*Context gathered: 2026-01-24*

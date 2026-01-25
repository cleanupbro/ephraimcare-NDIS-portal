# Phase 6: Case Notes - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Workers document care delivered after each shift via the mobile app, and admin reviews all notes with filters on the participant detail page. This provides the evidence trail required for NDIS claims. Creating notes, reviewing notes, flagging concerns, and admin acknowledgement are in scope. New capabilities (attachments, templates, AI summaries) are not.

</domain>

<decisions>
## Implementation Decisions

### Note creation flow
- Bottom sheet / modal slides up after checkout (not full-screen editor)
- Workers can add notes within 24 hours of shift completion (not only at checkout)
- If skipped at checkout, a badge appears on the My Notes tab showing pending count
- My Notes tab shows ONLY pending shifts that need notes (not past submitted notes)
- After 24-hour window, opportunity to write is gone

### Note content structure
- Single freeform text area with guided placeholder prompts (e.g., "Activities performed... Participant mood... Changes noticed...")
- Prompts are labels/suggestions inside one text field, not separate required fields
- Minimum 10 characters required (from requirements)
- "Flag concern" toggle — if enabled, shows a freeform text field to describe the concern
- Concern flag triggers push/email notification to admin immediately

### Admin review experience
- Case notes live as a tab on participant detail page (not a top-level nav item)
- Notes listed with timestamp and worker name
- Notes with flagged concerns show a red/orange badge in the list
- Filters: date range and worker (as per requirements, no additional filters)
- Admin can mark notes as "reviewed" (acknowledgement)
- Admin can leave a private comment on any note (not visible to worker)

### Note editing rules
- Workers can edit their own notes within 24 hours of the shift (same window as creation)
- Edits overwrite — no version history preserved
- After 24 hours, notes are locked (immutable)
- Admin cannot edit worker notes — can only delete inappropriate ones
- Admin review/comment does not lock the note within the 24h window

### Claude's Discretion
- Exact modal/sheet animation and sizing
- Note list sort order in admin view
- Concern notification delivery mechanism (email vs push vs both)
- Empty state copy for My Notes tab when nothing pending
- Badge styling and count display

</decisions>

<specifics>
## Specific Ideas

- Guided prompts in the text area should feel helpful, not bureaucratic — placeholder text that disappears as you type
- Concern badge should be immediately visible when scanning a list of notes (high contrast)
- The 24-hour creation/edit window matches the existing shift check-in time-based patterns in the app

</specifics>

<deferred>
## Deferred Ideas

- Photo/file attachments to case notes — future phase
- Note templates or quick-fill options — future phase
- Worker viewing their own past submitted notes (history view) — could add in a later iteration

</deferred>

---

*Phase: 06-case-notes*
*Context gathered: 2026-01-25*

# Phase 13: Scale Features - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the platform from single-provider to multi-organization SaaS with external integrations (NDIA, Xero), SMS notifications, enhanced mobile capabilities (biometrics, offline photos), and bulk operations. This phase enables Ephraim Care to grow and serve additional NDIS providers.

</domain>

<decisions>
## Implementation Decisions

### Multi-tenancy Model
- Self-service signup for new organizations (instant access after registration)
- Shared database with RLS enforcement (extend existing organization_id pattern)
- Per-participant pricing model (charge based on active participant count)
- Platform admin role with full cross-org visibility (view all orgs, impersonate, manage billing, aggregate stats)

### External Integrations
- NDIA API: One-click submit (admin clicks, system handles, shows result)
- Xero: Auto-sync on invoice finalize (no manual step required)
- Credentials: Manual API key entry in org settings (not OAuth, not platform-level)
- Error handling: Auto-retry 3 times, then alert admin with error details and manual retry option

### SMS Notifications
- Workers: Shift reminders only (24h and 2h before shift starts)
- Participants: Reminders (24h before) + invoice finalized notifications
- Timing: Dual reminders (24h before and 2h before shifts)
- Opt-out: Both profile toggle and STOP reply work (carrier-handled + app setting)

### Mobile Enhancements
- Biometric fallback: PIN entry (4-6 digit PIN set during onboarding)
- Offline photos: 3 photos per shift maximum (conserve storage, sync when online)
- Sync conflicts: Prompt worker to choose which version to keep
- Bulk shifts: Preview with edit (show all shifts, allow individual modifications before confirming)

### Claude's Discretion
- SMS provider choice (Twilio, MessageBird, etc.)
- PIN encryption and storage method
- Photo compression algorithm
- Retry timing intervals for API failures
- Platform admin UI layout

</decisions>

<specifics>
## Specific Ideas

- RLS already uses organization_id on all tables — extend pattern for multi-tenancy
- Per-participant billing aligns with NDIS provider economics (scale with client base)
- One-click NDIA submit reduces admin friction for claims
- 3 photo limit prevents storage bloat on worker devices
- Conflict prompting gives workers agency over their own data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-scale-features*
*Context gathered: 2026-01-27*

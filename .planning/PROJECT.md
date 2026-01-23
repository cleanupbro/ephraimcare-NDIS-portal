# Ephraim Care NDIS Management Platform

## What This Is

A web and mobile platform for Ephraim Care — an NDIS (National Disability Insurance Scheme) provider in Australia — to manage participants, workers, shifts, case notes, invoicing, and compliance. Replaces their current Excel/email/phone-based workflow with a unified system that scales from 20 to 200+ participants. This is a client project delivered by OpBros.ai.

## Core Value

Ephraim Care can schedule shifts, track worker check-ins, and generate accurate invoices from actual hours worked — without spreadsheets, duplicate data entry, or compliance gaps.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Phase 1: Core Operations (MVP — Week 1-2)
- [ ] Auth system with 4 roles (Admin, Coordinator, Worker, Participant)
- [ ] Participant management (CRUD, NDIS plan info, budget tracking)
- [ ] Worker management (CRUD, qualifications, compliance dates)
- [ ] Shift scheduling with validation (conflicts, plan dates, qualifications)
- [ ] Worker mobile app with check-in/out and case notes
- [ ] Case notes management (worker creates, admin reviews)
- [ ] Automatic invoice generation from completed shifts
- [ ] Participant portal (dashboard, plan view, appointments, invoices, cancellation requests)

#### Phase 2: Compliance & Safety (Week 3-4)
- [ ] Incident reporting and tracking (with NDIA reporting workflow)
- [ ] Worker screening validation (block expired checks, warn on expiring)
- [ ] Compliance dashboard with health score

#### Phase 3: Integrations & Reporting (Week 5-8)
- [ ] Budget utilization report
- [ ] Revenue report
- [ ] Worker hours report
- [ ] Participant activity report
- [ ] CSV/Excel export for accounting (Xero/MYOB compatible)
- [ ] PDF export for reports and invoices

#### Phase 4: Scale & Nice-to-Haves (Optional/Ongoing)
- [ ] Multi-organization support
- [ ] SMS reminders for shifts
- [ ] Goal tracking for participants
- [ ] NDIA API integration
- [ ] Xero API integration
- [ ] Advanced mobile features (offline photos, etc.)

### Out of Scope

- Payment processing (Stripe/PayPal) — invoices generated but payment collected externally
- Video conferencing — not relevant to care delivery workflow
- Real-time chat — complexity not justified for MVP; use existing phone/email
- OAuth login (Google/GitHub) — email/password + magic links sufficient for NDIS context
- Custom branding per organization — single-tenant for Ephraim Care only (multi-org in Phase 4)
- Travel time tracking — not billed, adds complexity without value for MVP

## Context

### Business Context
- **Client:** Ephraim Care (NDIS provider, Australia)
- **Current state:** Under 20 participants, managing via Excel/email/phone
- **Pain points:** Lost data, duplicate entry, billing errors, compliance gaps, staff confusion
- **Delivered by:** OpBros.ai (Shamal Krishna) — first client project
- **Footer branding:** "Powered by OpBros" on all portals

### Technical Environment
- Greenfield project — no existing codebase
- Team: 1 AI developer (Claude Code) + project lead
- Infrastructure budget: ~$50-100/month (Supabase + Vercel)

### Brand Guidelines
- **Primary color:** #66BB6A (green)
- **Accent color:** #00BFA5 (teal)
- **Background:** #FFFFFF
- **Heading font:** Montserrat
- **Body font:** Inter
- **Border radius:** 8px
- **Logo:** Available from ephraimcare.com.au
- **Footer:** "Powered by OpBros" linking to opbros.online

### NDIS Compliance Context
- Worker screening checks (NDIS Worker Check, Working with Children Check) must be validated
- Incidents must be reportable to NDIA within 24 hours
- Case notes provide evidence of care delivered
- Audit trail required (created_at, updated_at on all records)
- Row Level Security enforces data isolation

## Constraints

- **Tech Stack:** Next.js 14+ (web), React Native/Expo (mobile), Supabase (backend), Vercel (hosting)
- **Structure:** Monorepo — apps/admin, apps/participant, apps/worker-mobile, packages/shared
- **Timeline:** 8 weeks (4 phases), Phase 1 MVP in 2 weeks
- **Budget:** Minimal — Supabase free/pro tier, Vercel free tier, Expo Go distribution
- **Environments:** Dev + Prod (two Supabase projects)
- **Migrations:** SQL files checked into Git, repeatable from scratch
- **Testing:** Full automated test coverage (Jest, React Testing Library)
- **Observability:** Error log table in Supabase for day-1 debugging
- **Mobile distribution:** Expo Go (QR code) for testing phase
- **Email:** Supabase built-in auth emails + basic operational notifications
- **GST:** Always 10% on all invoices (Ephraim Care is GST-registered)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo structure | Shared types, utilities, and Supabase client across 3 apps | — Pending |
| Supabase over custom backend | Auth + RLS + realtime built-in, no custom API needed | — Pending |
| Expo Go over app store | Fastest path to testing; app store submission deferred | — Pending |
| Shift conflicts: warn not block | Some workers legitimately do back-to-back/overlapping shifts | — Pending |
| Billing: lesser of scheduled vs actual | Prevents overbilling while respecting scheduled agreements | — Pending |
| Exact minute rounding | Most accurate billing; no disputes over rounding direction | — Pending |
| Plan validity: warn not block | Plans get extended informally; hard block causes friction | — Pending |
| Auto-checkout + admin override | Handles forgotten checkouts without blocking invoicing | — Pending |
| Case notes internal only | Participants should not see clinical/behavioral observations | — Pending |
| Participant can request cancellations | Better UX than phone-only; admin still approves | — Pending |
| Configurable support type rates | Rates change; admin needs to update without code changes | — Pending |
| SQL migrations in Git | Repeatable, auditable schema changes across environments | — Pending |
| Full demo seed data | 5 participants, 5 workers, 20 shifts, 2 invoices for testing | — Pending |
| Error log table over Sentry | Simpler for MVP; upgrade to Sentry if needed later | — Pending |
| Dev + Prod environments | Cheapest multi-env setup; staging added if needed | — Pending |

---
*Last updated: 2026-01-24 after initialization*

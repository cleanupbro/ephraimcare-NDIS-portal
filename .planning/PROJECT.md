# Ephraim Care NDIS Management Platform

## What This Is

A web and mobile platform for Ephraim Care — an NDIS (National Disability Insurance Scheme) provider in Australia — to manage participants, workers, shifts, case notes, invoicing, and compliance. The platform replaces Excel/email/phone workflows with a unified system that scales from 20 to 200+ participants. Delivered by OpBros.ai.

**v1.0 shipped:** 2026-01-27 — Full-featured platform with admin portal, worker mobile app, and participant portal.

## Core Value

Ephraim Care can schedule shifts, track worker check-ins, and generate accurate invoices from actual hours worked — without spreadsheets, duplicate data entry, or compliance gaps.

## Current State

**Version:** v1.0 (shipped)
**Codebase:** ~36,649 LOC TypeScript across 324 files
**Architecture:** Monorepo with 3 apps + 5 packages

### Apps
- **apps/admin** — Next.js 14 admin portal (participant, worker, shift, invoice management)
- **apps/participant** — Next.js 14 participant portal (budget tracking, invoices, appointments)
- **apps/worker-mobile** — React Native/Expo worker app (check-in/out, case notes, schedule)

### Packages
- **packages/types** — Shared TypeScript types
- **packages/supabase** — Supabase client configuration
- **packages/ui** — Shared UI components (shadcn/ui based)
- **packages/utils** — Shared utilities and validators
- **packages/config** — Shared configuration (ESLint, TypeScript)

## Requirements

### Validated

- ✓ Auth system with 4 roles (Admin, Coordinator, Worker, Participant) — v1.0
- ✓ Participant management (CRUD, NDIS plan, budget tracking) — v1.0
- ✓ Worker management (CRUD, qualifications, compliance dates) — v1.0
- ✓ Shift scheduling with validation (conflicts, plan dates, qualifications) — v1.0
- ✓ Worker mobile app (GPS check-in/out, case notes, offline sync) — v1.0
- ✓ Automatic invoice generation (lesser-of billing rule) — v1.0
- ✓ Participant portal (dashboard, invoices, appointments) — v1.0
- ✓ Email notifications (shift assignment, cancellation, invoice) — v1.0
- ✓ Worker screening validation (block expired, warn expiring) — v1.0
- ✓ Incident reporting with NDIA workflow — v1.0
- ✓ Compliance dashboard with health score — v1.0
- ✓ Comprehensive reporting (budget, revenue, hours, activity) — v1.0
- ✓ CSV/Excel/PDF export — v1.0
- ✓ Multi-organization foundation — v1.0
- ✓ SMS reminders via Twilio — v1.0
- ✓ Xero OAuth2 integration foundation — v1.0
- ✓ Participant goal tracking — v1.0
- ✓ Bulk shift creation with recurring patterns — v1.0
- ✓ Mobile biometric auth (Face ID/Touch ID) — v1.0
- ✓ Offline photo capture and sync — v1.0
- ✓ PACE-compliant NDIA CSV export — v1.0

### Active

(None — v1.0 feature-complete. Future requirements to be defined in next milestone.)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Payment processing | Invoices generated but payment collected externally via NDIS/plan managers |
| Video conferencing | Not relevant to care delivery workflow |
| Real-time chat | Complexity not justified; phone/email sufficient |
| OAuth login (Google) | Email/password + magic links sufficient for NDIS context |
| Travel time tracking | Not billed by Ephraim Care |
| Payroll processing | Out of scope; workers paid separately |
| App Store submission | Expo Go distribution for now; app store deferred |

## Context

### Business
- **Client:** Ephraim Care (NDIS provider, Liverpool NSW, Australia)
- **Delivered by:** OpBros.ai (Shamal Krishna)
- **Current scale:** Under 20 participants, scaling to 200+
- **Footer branding:** "Powered by OpBros" on all portals

### Technical Environment
- **Hosting:** Vercel (web apps) + Expo Go (mobile)
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Storage)
- **Infrastructure cost:** ~$50-100/month

### Brand Guidelines
- **Primary:** #66BB6A (green)
- **Accent:** #00BFA5 (teal)
- **Fonts:** Montserrat (headings), Inter (body)
- **Border radius:** 8px

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo (Turborepo + pnpm) | Shared types and utilities across 3 apps | ✓ Good |
| Supabase over custom backend | Auth + RLS + realtime built-in | ✓ Good |
| Expo Go over app store | Fastest path to testing | ✓ Good |
| Shift conflicts: warn not block | Workers do back-to-back shifts | ✓ Good |
| Billing: lesser of scheduled vs actual | Prevents overbilling | ✓ Good |
| Support type mismatch: hard error | Data integrity for qualifications | ✓ Good |
| Auto-checkout + admin override | Handles forgotten checkouts | ✓ Good |
| Case notes internal only | Clinical privacy | ✓ Good |
| RLS helper with COALESCE fallback | Works without custom JWT hook | ✓ Good |
| Per-step useForm (not shared FormProvider) | React 19 compatibility | ✓ Good |
| expo-sqlite for session storage | SecureStore 2048-byte limit | ✓ Good |
| pg_cron for auto-checkout | Works even if app closed | ✓ Good |
| Gapless invoice counter (atomic upsert) | No race conditions | ✓ Good |
| Fire-and-forget notifications | Don't block user operations | ✓ Good |
| Multi-org RLS with platform admin override | Scalable foundation | ✓ Good |

## Constraints

- **Tech Stack:** Next.js 14 (web), Expo SDK 53 (mobile), Supabase, Vercel
- **GST:** Always 10% on all invoices
- **Environments:** Dev + Prod (separate Supabase projects)
- **Migrations:** SQL files in Git, repeatable from scratch
- **Mobile distribution:** Expo Go for testing phase

---
*Last updated: 2026-01-27 after v1.0 milestone*

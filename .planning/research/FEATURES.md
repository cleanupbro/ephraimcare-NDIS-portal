# Features Research: NDIS Management Platform

> **Research Date:** 2026-01-24
> **Context:** Ephraim Care — Australian NDIS provider, <20 participants, targeting 200+
> **Budget:** $50-100/month infrastructure
> **Roles:** Admin, Coordinator, Worker (mobile), Participant (read-only)

---

## Competitive Landscape

### Existing Platforms

| Platform | Target Size | Pricing Model | Key Strength | Key Weakness for Small Providers |
|----------|------------|---------------|--------------|----------------------------------|
| **ShiftCare** | All sizes | $9/staff/month (min 5 users) | All-in-one, family portal (ShiftCare Connect) | Costs scale fast with workers ($180+/month for 20 workers) |
| **SupportAbility** | Mid-Large | Per-organisation | ISO27001 certified, NDIS Practice Standards built-in | Enterprise-grade complexity, overkill for <20 participants |
| **Lumary** | 200+ providers | Enterprise (Salesforce-based) | PRODA/PACE API integration, 99% claim accuracy | Salesforce dependency, enterprise pricing |
| **MYP** | All sizes | Tiered | HICAPS + PRODA/PACE integration, plan management | Complex onboarding, feature bloat |
| **Brevity** | Small-Mid | Per-client | NDIS-specific from ground up, OCR invoicing, NDIS Digital Partner | Per-client pricing adds up, limited mobile |

### What They All Have in Common (Baseline)
- Participant/client records management
- Shift scheduling/rostering
- Time and attendance (check-in/out)
- Case/progress notes
- NDIS billing with price guide compliance
- Incident management
- Worker credential tracking
- Xero/MYOB accounting integration
- Mobile app for workers
- Bulk payment request generation

### Where They Differentiate
- **ShiftCare:** Family portal, job board for open shifts, AI-assisted notes
- **SupportAbility:** ISO31000 risk assessments, goal evidence tracking, privacy barriers per service
- **Lumary:** Salesforce ecosystem, multi-funding-stream, SIL-specific tools
- **MYP:** Plan management module, talk-to-text, DEX reporting
- **Brevity:** OCR invoice processing, NDIS API (PACE) native, group schedules

### Gap for Small Providers (<50 participants)
All existing platforms either:
1. Cost too much for small providers ($180-500+/month)
2. Are over-featured (80% of features unused)
3. Require significant onboarding/training investment
4. Don't prioritise mobile-first for field workers

**Opportunity:** Purpose-built, lean platform that does the 20% of features covering 80% of daily operations, at a fraction of the cost.

---

## Table Stakes Features

> Features that ALL competitive platforms have. Without these, workers/admins will reject the system and stay on Excel/paper.

### 1. Participant Management
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| Participant profile (name, DOB, NDIS number, contact, address, emergency contacts) | Low | Cannot operate without basic records |
| NDIS plan details (plan dates, funding categories, plan manager type) | Low | Required for billing and compliance |
| Service agreements (what supports are authorised) | Medium | Contractual requirement before delivering supports |
| Document storage (per participant) | Low | Audit requirement — assessments, consent forms, agreements |
| Participant status tracking (active, inactive, on-hold) | Low | Operational necessity |

### 2. Shift Scheduling & Rostering
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| Create/edit shifts (participant, worker, date, time, support type) | Medium | Core operational workflow |
| Worker availability management | Low | Cannot roster without knowing who is available |
| Shift assignment (match worker to participant) | Medium | Core admin function |
| Recurring/repeating shifts | Medium | 80%+ of NDIS shifts are regular weekly schedules |
| Shift conflict detection (double-booking prevention) | Medium | Prevents compliance violations and operational chaos |
| Shift notifications to workers | Low | Workers need to know their schedule |

### 3. Worker Check-in/Check-out
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| Mobile clock-in/clock-out | Medium | Proof of service delivery (mandatory for NDIS claims) |
| GPS location verification at check-in | Medium | Compliance evidence, prevents fraudulent claims |
| Shift duration calculation | Low | Required for accurate invoicing |
| Late/missed shift alerts to coordinator | Low | Operational safety — participant left without support |

### 4. Case Notes / Progress Notes
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| Post-shift case note entry (mandatory before shift completion) | Medium | NDIS requirement: "complete and accurate records of supports delivered" |
| Note templates (structured prompts) | Low | Consistency, reduces training burden |
| Note history per participant (chronological) | Low | Continuity of care, audit trail |
| Internal vs. participant-visible notes | Low | Privacy management — some notes are worker-only |
| Attachment support (photos) | Low | Evidence of activities, progress documentation |

### 5. Incident Reporting
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| Incident creation (6 NDIS categories: death, serious injury, abuse/neglect, unlawful contact, sexual misconduct, unauthorised restrictive practices) | Medium | **Regulatory mandate** — must report within 24 hours |
| Incident severity classification | Low | Determines reporting pathway |
| 24-hour notification to admin/coordinator | Low | Regulatory timeframe requirement |
| 5-day follow-up tracking | Low | Second report required within 5 business days |
| Incident history and audit trail | Low | Commission audit evidence |

### 6. Worker Screening & Compliance
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| Worker screening check number and expiry date storage | Low | **Regulatory mandate** — cannot work without valid clearance |
| Expiry alerts (90 days, 30 days, expired) | Low | Workers cannot deliver supports with expired checks |
| Worker qualifications/certifications tracking | Low | Some supports require specific qualifications |
| First aid / CPR expiry tracking | Low | Standard workplace requirement |
| Prevent shift assignment to non-compliant workers | Medium | Compliance enforcement |

### 7. NDIS Billing & Invoicing
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| NDIS Price Guide line items (current 2025-26 catalogue) | Medium | Must charge correct amounts — overcharging = compliance breach |
| Invoice generation from completed shifts | Medium | Core revenue workflow |
| Bulk Payment Request CSV generation (NDIA-managed) | High | **PACE requirement** — all claims via bulk upload template |
| Plan-managed invoice generation (PDF to plan manager) | Medium | Second most common payment pathway |
| Self-managed invoice generation | Low | Direct to participant |
| Claim status tracking (submitted, paid, rejected) | Medium | Cash flow management |

### 8. Basic Reporting
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| Service delivery summary (per participant, per period) | Medium | Audit evidence, plan reviews |
| Worker hours summary | Low | Payroll input, compliance |
| Outstanding claims report | Low | Cash flow visibility |
| Incident summary report | Low | Commission reporting |

### 9. Access Control & Security
| Feature | Complexity | Why Table Stakes |
|---------|-----------|-----------------|
| Role-based access (Admin, Coordinator, Worker, Participant) | Medium | Privacy Act compliance, NDIS Practice Standards |
| Secure authentication (email/password + session management) | Medium | Data protection requirement |
| Audit logging (who accessed/changed what) | Medium | NDIS Practice Standards — accountability |
| Data encryption at rest and in transit | Low (infrastructure) | Standard security expectation |

---

## Differentiators

> Features that provide competitive advantage over Excel/manual processes and basic competitors. These are what make workers and admins choose this system over alternatives.

### 1. Mobile-First Worker Experience
| Feature | Complexity | Competitive Advantage |
|---------|-----------|----------------------|
| Offline-capable check-in/out (sync when back online) | High | Workers in areas with poor reception can still log shifts |
| Voice-to-text case notes | Medium | Workers write notes faster in the field, captures detail while fresh |
| One-tap shift acceptance/rejection | Low | Faster than phone calls/texts for shift offers |
| Push notifications for upcoming shifts | Low | Replaces manual reminder calls from coordinators |
| View participant care summary before arrival | Low | Worker arrives prepared, better care outcomes |

### 2. Automated Compliance Engine
| Feature | Complexity | Competitive Advantage |
|---------|-----------|----------------------|
| Dashboard showing all compliance gaps at a glance | Medium | Admin sees problems before auditors do |
| Auto-block shift assignment for expired worker screenings | Medium | Prevents compliance breach before it happens |
| Overdue case note alerts (shift completed, no note) | Low | Ensures documentation completeness |
| Incident report deadline countdown (24hr initial, 5-day follow-up) | Low | Never miss a mandatory reporting deadline |
| NDIS price guide auto-update alerts when new guide released | Low | Prevents billing errors during transition periods |

### 3. Real-Time Budget Visibility
| Feature | Complexity | Competitive Advantage |
|---------|-----------|----------------------|
| Live participant budget tracker (funds used vs remaining) | High | Prevents over-servicing, enables proactive plan reviews |
| Budget burn-rate projections | Medium | Predict when funds will run out at current usage |
| Low-budget alerts to coordinator | Low | Avoid surprise plan exhaustion |
| Budget utilisation reports for plan reviews | Medium | Evidence for NDIA plan reassessments |

### 4. Participant & Family Portal
| Feature | Complexity | Competitive Advantage |
|---------|-----------|----------------------|
| View upcoming shifts (who is coming, when) | Low | Transparency, reduces phone calls to office |
| View completed shift notes (filtered for participant-safe content) | Low | Families stay informed about care |
| Request shift cancellation (with policy-compliant notice period) | Medium | Self-service reduces admin phone calls by 30-50% |
| View invoices and budget summary | Low | Financial transparency builds trust |
| Receive notifications for shift changes | Low | Proactive communication |

### 5. Smart Scheduling
| Feature | Complexity | Competitive Advantage |
|---------|-----------|-----------------|
| Shift templates (weekly schedule copy-forward) | Medium | Reduces weekly rostering from hours to minutes |
| Open shift broadcasting to available workers | Medium | Fills gaps faster than phone trees |
| Travel time consideration between shifts | Medium | Prevents back-to-back shifts in distant locations |
| Worker-participant preference matching | Low | Continuity of care, participant satisfaction |

### 6. Streamlined PACE Claims
| Feature | Complexity | Competitive Advantage |
|---------|-----------|----------------------|
| Auto-populate bulk payment CSV from completed shifts | High | Eliminates manual CSV creation (error-prone, time-consuming) |
| Claim validation before submission (correct line items, dates, amounts) | Medium | Reduces rejected claims (each rejection = 10+ day payment delay) |
| Claim batch tracking (submitted date, expected payment date) | Low | Cash flow predictability |
| Rejection reason logging and resubmission workflow | Medium | Faster error resolution |

### 7. Communication Hub
| Feature | Complexity | Competitive Advantage |
|---------|-----------|----------------------|
| In-app messaging (coordinator <-> worker) | Medium | Replaces scattered WhatsApp/SMS threads |
| Shift handover notes (previous worker -> next worker) | Low | Continuity of care without coordinator involvement |
| Broadcast messages to worker groups | Low | Efficient team communication |

---

## Anti-Features (Do NOT Build)

> Features to deliberately exclude from the MVP. Each would add significant complexity, development time, or operational burden without proportional value for a <20 participant provider scaling to 200.

| Feature | Why NOT to Build |
|---------|-----------------|
| **Full Plan Management Module** | Separate business line with distinct compliance requirements. Plan managers need invoice processing, provider payments, NDIA reconciliation. Ephraim Care is a service provider, not a plan manager. |
| **Allied Health / Therapy Tools** | Therapist-specific features (treatment plans, clinical assessments, outcome measures) serve a different user type. Over-specialisation for a general support provider. |
| **Multi-Funding Stream Support (HCP/CHSP/DSS)** | Each funding stream has different rules, pricing, and reporting. Scope creep that triples complexity. Focus on NDIS only. |
| **OCR Invoice Processing** | Expensive AI/ML capability, only useful for plan managers processing third-party invoices. Ephraim Care generates invoices, doesn't process incoming ones. |
| **AI-Powered Auto-Rostering** | Optimisation algorithms need large datasets to be useful. With <20 participants and a small worker pool, manual assignment with smart suggestions is sufficient. |
| **Complex Group Activity Scheduling** | SIL (Supported Independent Living) house rosters and group programs are a distinct operational model. Build only if Ephraim Care enters SIL. |
| **Full Payroll Processing** | Payroll has massive compliance burden (awards, super, tax, leave). Use existing payroll systems (Xero, MYOB, KeyPay) and export timesheet data. |
| **Custom Form Builder** | Drag-and-drop form creation is complex to build and maintain. Use pre-built templates for common forms (risk assessments, consent, service agreements). |
| **Marketplace / Provider Directory** | Platform play that requires network effects to be valuable. Not relevant for a single provider managing their own participants. |
| **Full CRM / Sales Pipeline** | Ephraim Care gets referrals through relationships, not a sales funnel. A simple referral intake form is sufficient. |
| **Behaviour Support Plan Management** | Requires specialist practitioner tools, restrictive practices tracking, and NDIS Commission reporting. Only build if Ephraim Care delivers behaviour support. |
| **Video Calling / Telehealth** | Use Zoom/Teams. Building video infrastructure is expensive and unnecessary when commodity solutions exist. |
| **Xero/MYOB Direct Integration (MVP)** | Export to CSV/PDF is sufficient for MVP. Direct API integration adds complexity and maintenance burden for questionable time savings at <20 participants. |
| **Multi-Organisation / White-Label** | Building for one organisation. Multi-tenancy adds architectural complexity. Can be added later if the platform is sold to other providers. |
| **Detailed Analytics / BI Dashboards** | At <20 participants, basic reports are sufficient. Complex analytics become valuable at 100+ participants. Build reporting infrastructure that can grow. |

---

## Feature Dependencies

> Understanding what must be built first to enable downstream features.

```
Participant Management (foundation)
  |
  +-- Service Agreements
  |     |
  |     +-- NDIS Line Item Assignment
  |           |
  |           +-- Invoice Generation
  |                 |
  |                 +-- Bulk Payment CSV Export
  |                 +-- Budget Tracking
  |
  +-- Shift Scheduling
  |     |
  |     +-- Worker Assignment
  |     |     |
  |     |     +-- Worker Compliance Check (pre-assignment validation)
  |     |
  |     +-- Check-in / Check-out
  |     |     |
  |     |     +-- GPS Verification
  |     |     +-- Shift Duration Calculation
  |     |           |
  |     |           +-- Timesheet Generation
  |     |           +-- Invoice Line Items
  |     |
  |     +-- Case Notes (post-shift)
  |           |
  |           +-- Participant-visible Notes (filtered)
  |           +-- Handover Notes
  |
  +-- Incident Reporting (independent, but links to participant + worker)
  |
  +-- Worker Screening (independent, but blocks shift assignment)

User Authentication & Roles (foundation for everything)
  |
  +-- Admin Dashboard
  +-- Coordinator View
  +-- Worker Mobile App
  +-- Participant Portal (read-only)
```

### Critical Path for MVP
1. **User Auth + Roles** — Everything depends on this
2. **Participant Management** — Core data entity
3. **Worker Management + Screening** — Core data entity
4. **Shift Scheduling** — Core operational workflow
5. **Check-in/Check-out** — Proof of delivery
6. **Case Notes** — Mandatory documentation
7. **Incident Reporting** — Regulatory requirement
8. **Invoicing + Bulk Payment CSV** — Revenue generation

### Phase 2 (Post-MVP)
- Participant Portal
- Budget Tracking
- Compliance Dashboard
- Communication Hub
- Smart Scheduling features

---

## NDIS-Specific Requirements

> Regulatory requirements from the NDIS Quality and Safeguards Commission that directly affect feature design.

### 1. NDIS Practice Standards (2025-26)

| Standard | Feature Implication |
|----------|-------------------|
| **Governance and Operational Management** | Audit logs, role-based access, documented processes |
| **Provision of Supports** | Service agreements before delivery, case notes per shift |
| **Support Provision Environment** | Risk assessments stored per participant |
| **Safe Environment** | Incident reporting, worker screening validation |
| **Human Resource Management** | Worker qualifications tracking, screening checks, training records |
| **Continuity of Supports** | Handover notes, shift history accessible to new workers |
| **Feedback and Complaints Management** | Participant complaint mechanism (portal feature) |

### 2. Incident Reporting Rules

- **6 reportable categories** must be available as structured options (not free text)
- **24-hour initial report** — system must timestamp and alert
- **5-day follow-up** — system must track and remind
- **Allegations count** — even unsubstantiated allegations must be reported
- **Cannot be deleted** — incident records must be immutable (audit trail)
- **Multi-body reporting** — some incidents also go to police, child safety (note in system, action outside system)

### 3. Worker Screening Requirements

- **Valid clearance required** before ANY shift in a risk-assessed role
- **5-year validity** with renewal available 90 days before expiry
- **Ongoing monitoring** — clearance can be revoked at any time
- **National portability** — one clearance valid across all states
- **Provider verification** — provider must confirm worker is linked to their organisation
- **System implication:** Must prevent scheduling a worker with expired/revoked screening

### 4. NDIS Pricing & Claims (2025-26)

- **Price limits are caps** — registered providers cannot exceed them
- **Line item codes** change annually (July 1) — system must be updatable
- **Support Catalogue structure:** Category_Sequence_RegistrationGroup_OutcomeDomain_SupportPurpose
- **Bulk Payment Request CSV** is the only claiming method under PACE
- **CSV format is strict:** 16 columns, specific date format (YYYY-MM-DD), max 5000 rows, filename max 20 characters
- **Claim within 2 years** of support delivery date (effective Oct 2024)
- **Rejected claims** cannot be modified — must resubmit as new
- **Remote loading:** 40% (MMM6) or 50% (MMM7) price increase for remote areas

### 5. Record Keeping Requirements

- **Progress notes are mandatory** for all NDIS claims
- **Must include:** date, time, duration, type of support, who delivered it, participant response
- **Records must be maintained** for 7 years after last service delivery
- **Digital signatures** may be required for service delivery acceptance
- **Privacy Act 1988** — participant data must be protected, access controlled

### 6. Plan Management Types (Affects Invoicing)

| Type | Who Pays Provider | Claiming Method | System Requirement |
|------|------------------|-----------------|-------------------|
| **NDIA-managed** | NDIA directly | Bulk Payment CSV via myplace portal | Generate compliant CSV, track "my providers" endorsement |
| **Plan-managed** | Plan Manager | Invoice (PDF/email) to plan manager | Generate invoice with ABN, line items, correct pricing |
| **Self-managed** | Participant directly | Invoice to participant | Generate invoice, participant may dispute via portal |

### 7. PACE System Implications (2025-26)

- **No more service bookings** for PACE plans — "my providers" endorsement replaces them
- **All claims via bulk upload** — single-line claims rejected for PACE participants
- **Funding tied to goals/periods** — invoicing must align with plan structure
- **Participants can dispute claims** — system should track claim status
- **2-3 day payment for "my providers"** vs 10 days for non-endorsed providers

---

## Summary: MVP Feature Count

| Category | Table Stakes | Differentiators (Phase 1) | Total |
|----------|:---:|:---:|:---:|
| Participant Management | 5 | 0 | 5 |
| Scheduling | 6 | 2 | 8 |
| Check-in/out | 4 | 1 | 5 |
| Case Notes | 5 | 1 | 6 |
| Incident Reporting | 5 | 0 | 5 |
| Worker Compliance | 5 | 2 | 7 |
| Billing/Invoicing | 6 | 2 | 8 |
| Reporting | 4 | 1 | 5 |
| Access Control | 4 | 0 | 4 |
| Participant Portal | 0 | 5 | 5 |
| Communication | 0 | 3 | 3 |
| **TOTAL** | **44** | **17** | **61** |

**Recommendation:** Build the 44 table-stakes features as MVP. Add differentiators in phases based on user feedback and growth.

---

## Sources

- [ShiftCare - NDIS Provider Software](https://shiftcare.com/solutions/ndis-providers-software)
- [SupportAbility - NDIS Software](https://www.supportability.com.au/)
- [Lumary - NDIS Software](https://lumary.com/ndis-software/)
- [MYP - NDIS Software](https://mypcorp.com.au/ndis-software/)
- [Brevity - NDIS Software](https://www.brevity.com.au/ndis-software/)
- [NDIS Quality and Safeguards Commission](https://www.ndiscommission.gov.au/)
- [NDIS Practice Standards 2025](https://providersconsultant.com.au/ndis-practice-standards-and-quality-indicators-2025/)
- [NDIS Reportable Incidents](https://www.ndiscommission.gov.au/rules-and-standards/reportable-incidents-and-incident-management/reportable-incidents)
- [NDIS Worker Screening](https://www.ndiscommission.gov.au/workforce/worker-screening)
- [NDIS Pricing Arrangements 2025-26](https://www.ndis.gov.au/media/7739/download?attachment=)
- [NDIS Bulk Payments](https://www.ndis.gov.au/providers/working-provider/getting-paid/bulk-payments)
- [NDIS PACE Changes](https://improvements.ndis.gov.au/providers/claims-and-payments)
- [NDIS Compliance Checklist 2025](https://inficurex.com/ndis-compliance-checklist-2025/)
- [CareMaster Support Worker App](https://caremaster.com.au/features/support-worker-app-features/)
- [NDIS Line Items Guide 2025-26](https://mdhomecare.com.au/blog/ndis-line-items-guide-2024-25/)

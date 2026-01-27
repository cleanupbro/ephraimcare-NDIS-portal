# Phase 11 Research: Compliance and Incidents

## Overview

Phase 11 adds incident reporting, compliance dashboard, participant portal extensions, and shift management features. This is a larger phase with 13 requirements spanning multiple areas.

## Requirements Breakdown

### Area 1: Incident Reporting (INCD-01 to INCD-05)

**Database Design:**
```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  participant_id UUID REFERENCES participants(id),
  worker_id UUID REFERENCES workers(id),
  reported_by UUID NOT NULL REFERENCES profiles(id),

  -- Core fields
  incident_type TEXT NOT NULL, -- injury, medication_error, property_damage, behavioral, abuse_neglect, other
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  actions_taken TEXT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'closed')),

  -- NDIA reporting
  requires_ndia_report BOOLEAN DEFAULT FALSE,
  ndia_reported_at TIMESTAMPTZ,
  ndia_reference_number TEXT,
  ndia_reported_by UUID REFERENCES profiles(id),

  -- Timestamps
  incident_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Incident Types (NDIS standard):**
- Injury
- Medication Error
- Property Damage
- Behavioral Incident
- Abuse/Neglect (requires NDIA report within 24h)
- Other

**Severity Levels:**
- Low: Minor issue, no immediate action required
- Medium: Requires attention within 24-48 hours
- High: Requires immediate attention
- Critical: Requires NDIA notification within 24 hours

**NDIA Reporting Rules:**
- Critical severity incidents must be reported to NDIA within 24 hours
- Abuse/Neglect incidents always require NDIA notification
- System shows countdown timer for unreported incidents

### Area 2: Compliance Dashboard (COMP-01 to COMP-03)

**Health Score Calculation:**
```typescript
function calculateComplianceScore(data: ComplianceData): number {
  const weights = {
    workerCompliance: 0.4,    // % of workers with valid checks
    incidentResolution: 0.3,  // % of incidents closed within SLA
    documentationComplete: 0.3 // % of participants with complete docs
  }

  return (
    data.workerComplianceRate * weights.workerCompliance +
    data.incidentResolutionRate * weights.incidentResolution +
    data.documentationRate * weights.documentationComplete
  ) * 100
}
```

**Dashboard Widgets:**
1. Overall health score (percentage with color coding)
2. Workers: Valid/Expiring/Expired breakdown
3. Incidents: Open/In Review/Closed this month
4. Documentation: Complete/Incomplete participant records

### Area 3: Participant Portal (PTPL-06, PTPL-07)

**Upcoming Appointments:**
- Query shifts where participant_id = current user's participant
- Status = scheduled or confirmed
- Date >= today
- Order by scheduled_start ASC

**Cancellation Requests:**
```sql
CREATE TABLE shift_cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  participant_id UUID NOT NULL REFERENCES participants(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Area 4: Magic Link Auth (AUTH-09)

Supabase supports magic link out of the box:
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: participantEmail,
  options: {
    emailRedirectTo: `${origin}/participant/auth/callback`
  }
})
```

### Area 5: Shift Calendar (SHFT-10)

**Library Options:**
- `react-big-calendar` - Full-featured, heavyweight
- `@fullcalendar/react` - Industry standard, modular
- Custom grid with date-fns - Lightweight, full control

**Recommendation:** Custom grid for week/day views, keeping it lightweight and matching existing design system.

### Area 6: Recurring Shifts (SHFT-11)

**Database Approach:**
Option A: Generate all shifts upfront
Option B: Store recurrence pattern, generate on-the-fly

**Recommendation:** Option A (generate upfront) - simpler to query, edit, and cancel individual occurrences.

```typescript
interface RecurringShiftPattern {
  start_date: string
  end_date: string       // max 12 weeks out
  days_of_week: number[] // 0=Sun, 1=Mon, etc.
  start_time: string
  duration_hours: number
  participant_id: string
  worker_id: string
  support_type: string
}
```

## Plan Breakdown

Given the scope, I recommend 7 plans:

| Plan | Focus | Requirements |
|------|-------|--------------|
| 01 | Incidents migration + types | DB foundation |
| 02 | Incident form + list (admin) | INCD-01, INCD-02, INCD-05 |
| 03 | NDIA reporting workflow | INCD-03, INCD-04 |
| 04 | Compliance dashboard | COMP-01, COMP-02, COMP-03 |
| 05 | Participant appointments + cancellation | PTPL-06, PTPL-07 |
| 06 | Participant magic link auth | AUTH-09 |
| 07 | Calendar view + recurring shifts | SHFT-10, SHFT-11 |

## Dependencies

- Plan 01 must complete before Plans 02-04
- Plans 02-07 can run in parallel after Plan 01

## Existing Patterns to Follow

- Zod schemas in `lib/{domain}/schemas.ts`
- Constants in `lib/{domain}/constants.ts`
- TanStack Query hooks in `hooks/use-{domain}.ts`
- DataTable for list views
- Sheet/Dialog for forms
- Badge for status indicators

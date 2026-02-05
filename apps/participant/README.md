# Participant Portal — `@ephraimcare/participant`

Next.js 15 self-service portal for NDIS participants to view their appointments, invoices, and budget.

**Dev port:** 3001

## Structure

```
apps/participant/
├── app/
│   ├── (auth)/               → Login page (public)
│   ├── (protected)/          → Authenticated routes
│   │   ├── page.tsx          → Dashboard (budget hero, upcoming appointments, recent invoices)
│   │   ├── appointments/     → View upcoming/past shifts, request cancellation
│   │   ├── invoices/         → View invoices, download PDF
│   │   └── profile/          → View/edit personal info
│   └── layout.tsx            → Root layout
├── components/
│   ├── dashboard/            → budget-hero, plan-info-card, expired-plan-banner, appointments-card
│   ├── appointments/         → appointment-card, cancellation-request-dialog
│   ├── invoices/             → invoice-table, invoice-preview-modal
│   ├── pdf/                  → InvoicePDF (react-pdf renderer)
│   └── layout/               → sidebar navigation
├── hooks/
│   ├── use-appointments.ts           → Fetch participant's shifts
│   ├── use-participant-dashboard.ts  → Dashboard data aggregation
│   ├── use-participant-profile.ts    → Fetch participant info
│   └── use-participant-invoices.ts   → Fetch invoice list
└── lib/
    ├── invoices/             → calculations, types, constants (shared logic)
    └── supabase/             → client, helpers (auth)
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Participant login |
| `/` | Dashboard — budget progress, upcoming appointments, recent invoices, plan info |
| `/appointments` | Appointment list (upcoming/past), cancellation requests |
| `/invoices` | Invoice history with PDF download |
| `/profile` | View and edit contact information |

## Environment Variables

Same Supabase vars as root `.env.local`. The participant portal uses the same Supabase project.

## Deployment

Not yet deployed. Needs a separate Vercel project pointing to `apps/participant/` as root directory.

# Admin Hooks

Custom React Query hooks for server state management. Every database operation goes through these hooks.

## Hooks by Domain

### Participants
| Hook | Description |
|------|-------------|
| `useParticipants(options)` | Fetch participant list with search/status filter |
| `useParticipant(id)` | Fetch single participant + active NDIS plan |
| `useCreateParticipant()` | Mutation for new participant creation |
| `useUpdateParticipant()` | Mutation for participant updates |
| `useArchiveParticipant()` | Mutation to archive participant |
| `useHasActiveShifts(id)` | Check for unfinished shifts (blocks archive) |
| `useCheckNdis()` | Validate NDIS number uniqueness |

### Workers
| Hook | Description |
|------|-------------|
| `useWorkers()` | Fetch worker list |
| `useWorker(id)` | Fetch single worker with compliance info |
| `useCreateWorker()` | Mutation for worker invite + creation |
| `useWorkerStats()` | Hours/earnings breakdown for worker |

### Shifts
| Hook | Description |
|------|-------------|
| `useShifts()` | Fetch shifts with date/status/worker/participant filters |
| `useCreateShift()` | Create shift with conflict detection |
| `useUpdateShift()` | Reschedule/modify shift |
| `useCancelShift()` | Cancel shift with reason |
| `useBulkShifts()` | Bulk shift creation |

### Invoices & Reports
| Hook | Description |
|------|-------------|
| `useInvoices()` | Fetch invoice list with filters |
| `useBudgetReport()` | Participant budget breakdown |
| `useRevenueReport()` | Monthly revenue data |
| `useWorkerHoursReport()` | Worker hours by support type |
| `useParticipantActivityReport()` | Participant activity metrics |

### Other
| Hook | Description |
|------|-------------|
| `useGoals()` | CRUD for participant goals |
| `useIncidents()` | CRUD for incident reports |
| `useCaseNotes()` | Fetch case notes |
| `useCompliance()` | NDIA compliance status |
| `useRates()` | Support type hourly rates |
| `useHolidays()` | Public holiday dates |
| `useOrganization()` | Current org data |
| `useCancellationRequests()` | Shift cancellation requests |
| `useSessionTimeout()` | 8-hour auto-logout timer |

## Pattern

All hooks use TanStack React Query:
- **Queries:** `useQuery` with `queryKey` for caching and `queryFn` calling Supabase
- **Mutations:** `useMutation` with `onSuccess` invalidating related queries
- **Optimistic updates:** Some mutations update cache before server confirms

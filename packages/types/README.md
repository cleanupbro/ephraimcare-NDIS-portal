# @ephraimcare/types

Shared TypeScript type definitions for the entire monorepo.

## Files

| File | Description |
|------|-------------|
| `src/database.ts` | Auto-generated Supabase types from `pnpm db:generate-types` |
| `src/domain.ts` | Higher-level domain types derived from database types (Participant, Worker, Shift, Invoice, etc.) |
| `src/index.ts` | Re-exports all types |

## Usage

```typescript
import type { Participant, Worker, Shift, Invoice } from '@ephraimcare/types'
```

## Regenerating

After any database schema change:

```bash
pnpm db:generate-types
```

This runs `supabase gen types typescript` and writes to `src/database.ts`.
